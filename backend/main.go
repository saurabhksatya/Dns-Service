package main

import (
	"dns/types"
	"dns/utils"
	"log/slog"
	"net"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/miekg/dns"
)

func Index(c *echo.Context) error {
	return c.String(http.StatusOK, "Hello, World!")
}

func checkNameServerFromDockerCoreDNS(c *echo.Context) error {
	domain := c.Param("domain")
	println(domain)
	if err := utils.IsValidDomain(domain); err {
		e := &types.ErrorResponse{
			Message: "Invalid Domain",
		}
		return c.JSON(http.StatusBadRequest, e)
	}

	client := new(dns.Client)
	msg := new(dns.Msg)

	msg.SetQuestion(domain, dns.TypeNS)

	resp, _, err := client.Exchange(msg, "127.0.0.1:4000")
	if err != nil {
		e := &types.ErrorResponse{
			Message: err.Error(),
		}
		return c.JSON(http.StatusInternalServerError, e)
	}

	myNS := map[string]bool{
		"ns1.mdp.dpdns.org.": false,
		"ns2.mdp.dpdns.org.": false,
	}

	for _, ns := range resp.Answer {
		name := strings.ToLower(ns.(*dns.NS).Ns)
		println(name)
		if _, ok := myNS[name]; !ok {
			e := &types.ErrorResponse{
				Message: "Remove " + strings.ToLower(ns.(*dns.NS).Ns) + " from your NS records",
			}
			return c.JSON(http.StatusBadRequest, e)
		} else {
			myNS[name] = true
		}
	}

	for k, v := range myNS {
		if !v {
			e := &types.ErrorResponse{
				Message: strings.ToLower(k) + " is missing from your NS records",
			}
			return c.JSON(http.StatusBadRequest, e)
		}
	}

	final_resp := &types.CheckNameServerResponse{Success: true}
	return c.JSON(http.StatusOK, final_resp)
}

func checkNameServers(c *echo.Context) error {
	domain := c.Param("domain")
	println(domain)
	if err := utils.IsValidDomain(domain); err {
		e := &types.ErrorResponse{
			Message: "Invalid Domain",
		}
		return c.JSON(http.StatusBadRequest, e)
	}

	nsRecords, err := net.LookupNS(domain)
	if err != nil {
		e := &types.ErrorResponse{
			Message: "Failed to Lookup NS",
		}
		return c.JSON(http.StatusInternalServerError, e)
	}

	myNS := map[string]bool{
		"ns1.mdp.dpdns.org.": false,
		"ns2.mdp.dpdns.org.": false,
	}

	for _, ns := range nsRecords {
		name := strings.ToLower(ns.Host)
		if !myNS[name] {
			e := &types.ErrorResponse{
				Message: "Remove " + strings.ToLower(ns.Host) + " from your NS records",
			}
			return c.JSON(http.StatusBadRequest, e)
		} else {
			myNS[name] = true
		}
	}

	for k, v := range myNS {
		if !v {
			e := &types.ErrorResponse{
				Message: strings.ToLower(k) + " is missing from your NS records",
			}
			return c.JSON(http.StatusBadRequest, e)
		}
	}

	resp := &types.CheckNameServerResponse{Success: true}
	return c.JSON(http.StatusOK, resp)
}

func main() {
	if err := initDB(); err != nil {
		slog.Error("Failed to connect to database", "error", err)
		return
	}
	slog.Info("Connected to database")

	e := echo.New()

	//e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())

	e.GET("/", Index)
	e.GET("/checkNS/:domain", checkNameServers)
	e.GET("/test/:domain", checkNameServerFromDockerCoreDNS)

	go func() {
		if err := e.Start(":8000"); err != nil {
			slog.Error("Failed to start server", "error", err)
		}
	}()

	dns.HandleFunc(".", handleDNS)

	go func() {
		server := &dns.Server{Addr: ":8001", Net: "udp"}
		if err := server.ListenAndServe(); err != nil {
			slog.Error("Failed to start server", "error", err)
		}
	}()
	server := &dns.Server{Addr: ":8001", Net: "tcp"}
	if err := server.ListenAndServe(); err != nil {
		slog.Error("Failed to start server", "error", err)
	}
}
