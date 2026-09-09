package main

import (
	"context"
	"log/slog"
	"net"
	"strings"
	"time"

	"github.com/miekg/dns"
)

const (
	upstreamAddr = "1.1.1.1:53"
	defaultTTL   = 300
)

var authoritativeNS = []string{"ns1.mdp.dpdns.org.", "ns2.mdp.dpdns.org."}

type dbResult struct {
	authoritative bool
	rrs           []dns.RR
}

func handleDNS(w dns.ResponseWriter, r *dns.Msg) {
	msg := new(dns.Msg)
	msg.SetReply(r)
	msg.Authoritative = false

	if len(r.Question) == 0 {
		msg.Rcode = dns.RcodeFormatError
		w.WriteMsg(msg)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for _, q := range r.Question {
		res := lookupFromDB(ctx, q.Name, q.Qtype)
		if !res.authoritative {
			// Not a zone we host — forward to upstream.
			upstream := forwardUpstream(r)
			if upstream == nil {
				msg.Rcode = dns.RcodeServerFailure
				w.WriteMsg(msg)
				return
			}
			w.WriteMsg(upstream)
			return
		}
		msg.Authoritative = true
		msg.Answer = append(msg.Answer, res.rrs...)
	}

	w.WriteMsg(msg)
}

func lookupFromDB(ctx context.Context, qname string, qtype uint16) dbResult {
	name := strings.ToLower(strings.TrimSuffix(qname, "."))
	if name == "" {
		return dbResult{}
	}
	labels := strings.Split(name, ".")

	for i := 0; i < len(labels); i++ {
		domain := strings.Join(labels[i:], ".")
		site, err := lookupVerifiedSite(ctx, domain)
		if err != nil {
			slog.Error("failed to look up site", "domain", domain, "error", err)
			return dbResult{}
		}
		if site == nil {
			continue
		}
		rrs := answersForSite(ctx, site, labels, i, qname, qtype)
		return dbResult{authoritative: true, rrs: rrs}
	}

	return dbResult{}
}

func answersForSite(ctx context.Context, site *Site, labels []string, idx int, qname string, qtype uint16) []dns.RR {
	var rrs []dns.RR
	owner := dns.Fqdn(qname)
	ttl := uint32(defaultTTL)

	recordName := "@"
	if idx > 0 {
		recordName = strings.Join(labels[:idx], ".")
	}

	if qtype == dns.TypeNS && idx == 0 {
		for _, ns := range authoritativeNS {
			rrs = append(rrs, &dns.NS{
				Hdr: dns.RR_Header{Name: owner, Rrtype: dns.TypeNS, Class: dns.ClassINET, Ttl: ttl},
				Ns:  ns,
			})
		}
		return rrs
	}

	records, err := lookupRecords(ctx, site.ID, recordName)
	if err != nil {
		slog.Error("failed to look up records", "siteId", site.ID, "name", recordName, "error", err)
		return nil
	}

	var cnameTarget string
	for _, rec := range records {
		switch {
		case rec.Type == "A" && qtype == dns.TypeA:
			ip := net.ParseIP(rec.Value)
			if ip != nil && ip.To4() != nil {
				rrs = append(rrs, &dns.A{
					Hdr: dns.RR_Header{Name: owner, Rrtype: dns.TypeA, Class: dns.ClassINET, Ttl: ttl},
					A:   ip.To4(),
				})
			}
		case rec.Type == "AAAA" && qtype == dns.TypeAAAA:
			ip := net.ParseIP(rec.Value)
			if ip != nil && ip.To4() == nil {
				rrs = append(rrs, &dns.AAAA{
					Hdr:  dns.RR_Header{Name: owner, Rrtype: dns.TypeAAAA, Class: dns.ClassINET, Ttl: ttl},
					AAAA: ip,
				})
			}
		case rec.Type == "CNAME" && (qtype == dns.TypeCNAME || qtype == dns.TypeA || qtype == dns.TypeAAAA):
			target := dns.Fqdn(rec.Value)
			rrs = append(rrs, &dns.CNAME{
				Hdr:    dns.RR_Header{Name: owner, Rrtype: dns.TypeCNAME, Class: dns.ClassINET, Ttl: ttl},
				Target: target,
			})
			cnameTarget = target
		}
	}

	if cnameTarget != "" && (qtype == dns.TypeA || qtype == dns.TypeAAAA) {
		if chain := resolveTarget(ctx, cnameTarget, qtype); chain != nil {
			rrs = append(rrs, chain...)
		}
	}

	return rrs
}

func resolveTarget(ctx context.Context, target string, qtype uint16) []dns.RR {
	res := lookupFromDB(ctx, target, qtype)
	if res.authoritative {
		return res.rrs
	}
	return forwardQuery(target, qtype)
}

func forwardQuery(name string, qtype uint16) []dns.RR {
	m := new(dns.Msg)
	m.SetQuestion(dns.Fqdn(name), qtype)
	m.RecursionDesired = true
	resp := forwardUpstream(m)
	if resp == nil {
		return nil
	}
	return resp.Answer
}

func forwardUpstream(q *dns.Msg) *dns.Msg {
	client := &dns.Client{Net: "udp", Timeout: 5 * time.Second}
	resp, _, err := client.Exchange(q, upstreamAddr)
	if err != nil {
		client = &dns.Client{Net: "tcp", Timeout: 5 * time.Second}
		resp, _, err = client.Exchange(q, upstreamAddr)
	}
	if err != nil {
		slog.Error("upstream query failed", "upstream", upstreamAddr, "error", err)
		return nil
	}
	return resp
}
