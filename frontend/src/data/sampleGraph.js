// AtmoGraph - Sample dataset for Week 1 frontend scaffold.
// Small representative subset (matches the /graph API response shape).
// Week 2 will replace this with a live fetch from http://localhost:8000/graph

const industries = ['Electronics', 'Automotive', 'Textiles', 'Pharmaceuticals', 'Semiconductors']

function riskFor(score) {
  if (score < 0.25) return 'low'
  if (score < 0.5) return 'moderate'
  if (score < 0.75) return 'elevated'
  return 'high'
}

function buildSample() {
  const nodes = []
  const edges = []
  let edgeId = 0

  const suppliers = Array.from({ length: 24 }, (_, i) => {
    const risk = Math.round(Math.random() * 1000) / 1000
    return {
      id: `SUP_${i + 1}`,
      label: 'Supplier',
      name: `Supplier Co. #${i + 1}`,
      industry: industries[i % industries.length],
      risk_score: risk,
      risk_tag: riskFor(risk),
    }
  })

  const manufacturers = Array.from({ length: 12 }, (_, i) => {
    const risk = Math.round(Math.random() * 1000) / 1000
    return {
      id: `MAN_${i + 1}`,
      label: 'Manufacturer',
      name: `Manufacturing Plant #${i + 1}`,
      industry: industries[i % industries.length],
      risk_score: risk,
      risk_tag: riskFor(risk),
    }
  })

  const ports = Array.from({ length: 6 }, (_, i) => {
    const risk = Math.round(Math.random() * 1000) / 1000
    return {
      id: `PRT_${i + 1}`,
      label: 'Port',
      name: `Port Terminal #${i + 1}`,
      risk_score: risk,
      risk_tag: riskFor(risk),
    }
  })

  const distributors = Array.from({ length: 6 }, (_, i) => {
    const risk = Math.round(Math.random() * 1000) / 1000
    return {
      id: `DIS_${i + 1}`,
      label: 'Distributor',
      name: `Distribution Hub #${i + 1}`,
      risk_score: risk,
      risk_tag: riskFor(risk),
    }
  })

  nodes.push(...suppliers, ...manufacturers, ...ports, ...distributors)

  suppliers.forEach((s) => {
    const count = 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < count; k++) {
      const m = manufacturers[Math.floor(Math.random() * manufacturers.length)]
      edges.push({ id: `E${edgeId++}`, source: s.id, target: m.id, type: 'SUPPLIES_TO' })
    }
  })

  manufacturers.forEach((m) => {
    const count = 1 + Math.floor(Math.random() * 2)
    for (let k = 0; k < count; k++) {
      const p = ports[Math.floor(Math.random() * ports.length)]
      edges.push({ id: `E${edgeId++}`, source: m.id, target: p.id, type: 'SHIPS_VIA' })
    }
  })

  ports.forEach((p) => {
    const count = 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < count; k++) {
      const d = distributors[Math.floor(Math.random() * distributors.length)]
      edges.push({ id: `E${edgeId++}`, source: p.id, target: d.id, type: 'ROUTES_TO' })
    }
  })

  return { nodes, edges }
}

export const sampleGraph = buildSample()