import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = {
  Supplier: '#3FC7C0',
  Manufacturer: '#7C9EE8',
  Port: '#B48CE8',
  Distributor: '#E8B84B',
}

const NODE_RADIUS = {
  Supplier: 5,
  Manufacturer: 7,
  Port: 9,
  Distributor: 7,
}

const RISK_COLORS = {
  low: '#3FC7A0',
  moderate: '#E8B84B',
  elevated: '#E8823D',
  high: '#E2493D',
}

export default function GraphCanvas({ nodes, edges }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!nodes.length) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', [0, 0, width, height])

    const g = svg.append('g')

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
        }),
    )

    const nodeData = nodes.map((d) => ({ ...d }))
    const edgeData = edges.map((d) => ({ ...d }))

    const simulation = d3
      .forceSimulation(nodeData)
      .force(
        'link',
        d3
          .forceLink(edgeData)
          .id((d) => d.id)
          .distance(60)
          .strength(0.25),
      )
      .force('charge', d3.forceManyBody().strength(-90))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide((d) => (NODE_RADIUS[d.label] || 5) + 4),
      )

    const link = g
      .append('g')
      .attr('stroke', '#1F2A3F')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(edgeData)
      .join('line')
      .attr('stroke-width', 1)

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    node
      .filter((d) => d.risk_tag === 'high' || d.risk_tag === 'elevated')
      .append('circle')
      .attr('r', (d) => (NODE_RADIUS[d.label] || 5) + 2)
      .attr('fill', 'none')
      .attr('stroke', (d) => RISK_COLORS[d.risk_tag])
      .attr('stroke-width', 1.5)
      .attr('class', 'pulse-ring')
      .style('transform-origin', 'center')
      .style('transform-box', 'fill-box')

    node
      .append('circle')
      .attr('r', (d) => NODE_RADIUS[d.label] || 5)
      .attr('fill', (d) => NODE_COLORS[d.label] || '#7C8AA5')
      .attr('stroke', (d) => (d.risk_tag ? RISK_COLORS[d.risk_tag] : '#0B1220'))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.92)

    const tooltip = d3.select(tooltipRef.current)

    node
      .on('mouseenter', function (event, d) {
        d3.select(this).select('circle').attr('opacity', 1).attr('stroke-width', 2.5)
        tooltip
          .style('opacity', 1)
          .html(
            `<div class="font-display text-sm text-textPrimary">${d.name}</div>
             <div class="font-mono text-[10px] text-textMuted mt-0.5">${d.label}${d.industry ? ' · ' + d.industry : ''}</div>
             <div class="font-mono text-[10px] mt-1" style="color:${RISK_COLORS[d.risk_tag] || '#7C8AA5'}">
               RISK ${d.risk_tag ? d.risk_tag.toUpperCase() : 'N/A'}
             </div>`,
          )
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, container)
        tooltip.style('left', `${x + 16}px`).style('top', `${y + 16}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).select('circle').attr('opacity', 0.92).attr('stroke-width', 1.5)
        tooltip.style('opacity', 0)
      })

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [nodes, edges])

  return (
    <div ref={containerRef} className="relative w-full h-full grid-texture">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity duration-150 bg-panel border border-border rounded-lg px-3 py-2 shadow-lg z-10"
        style={{ minWidth: '160px' }}
      />
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-textMuted">
        SCROLL TO ZOOM · DRAG TO PAN · DRAG NODE TO REPOSITION
      </div>
    </div>
  )
}