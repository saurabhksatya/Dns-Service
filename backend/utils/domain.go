package utils

import (
	"golang.org/x/net/idna"
)

func IsValidDomain(domain string) bool {
	_, err := idna.Lookup.ToASCII(domain)
	return err != nil
}
