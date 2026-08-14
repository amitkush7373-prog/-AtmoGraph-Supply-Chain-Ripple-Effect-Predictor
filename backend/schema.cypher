// ===========================================================================
// AtmoGraph - Neo4j Schema
// Constraints + Indexes for Supplier, Manufacturer, Port, Distributor nodes
// Run this FIRST, before seeding data.
// ===========================================================================

CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS
FOR (s:Supplier) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT manufacturer_id_unique IF NOT EXISTS
FOR (m:Manufacturer) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT port_id_unique IF NOT EXISTS
FOR (p:Port) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT distributor_id_unique IF NOT EXISTS
FOR (d:Distributor) REQUIRE d.id IS UNIQUE;

CREATE INDEX supplier_industry_idx IF NOT EXISTS
FOR (s:Supplier) ON (s.industry);

CREATE INDEX manufacturer_industry_idx IF NOT EXISTS
FOR (m:Manufacturer) ON (m.industry);

CREATE INDEX supplier_risk_idx IF NOT EXISTS
FOR (s:Supplier) ON (s.risk_score);

CREATE INDEX manufacturer_risk_idx IF NOT EXISTS
FOR (m:Manufacturer) ON (m.risk_score);

CREATE INDEX port_risk_idx IF NOT EXISTS
FOR (p:Port) ON (p.risk_score);

CREATE INDEX distributor_risk_idx IF NOT EXISTS
FOR (d:Distributor) ON (d.risk_score);

CREATE INDEX supplier_country_idx IF NOT EXISTS
FOR (s:Supplier) ON (s.country);

CREATE INDEX port_country_idx IF NOT EXISTS
FOR (p:Port) ON (p.country);