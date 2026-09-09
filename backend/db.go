package main

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func initDB() error {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		url = "postgres://postgres:postgres@localhost:5432/app"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	pool, err = pgxpool.New(ctx, url)
	if err != nil {
		return err
	}
	return pool.Ping(ctx)
}

type Site struct {
	ID     string
	Domain string
}

type DnsRecord struct {
	Type  string
	Name  string
	Value string
	TTL   int
}

func lookupSite(ctx context.Context, domain string) (*Site, error) {
	var s Site
	err := pool.QueryRow(ctx,
		`SELECT id, domain FROM site WHERE lower(domain) = lower($1) LIMIT 1`,
		domain,
	).Scan(&s.ID, &s.Domain)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func lookupRecords(ctx context.Context, siteID, name string) ([]DnsRecord, error) {
	rows, err := pool.Query(ctx,
		`SELECT type, name, value, ttl FROM dns_record WHERE "siteId" = $1 AND lower(name) = lower($2) ORDER BY "createdAt"`,
		siteID, name,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []DnsRecord{}
	for rows.Next() {
		var rec DnsRecord
		if err := rows.Scan(&rec.Type, &rec.Name, &rec.Value, &rec.TTL); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}
