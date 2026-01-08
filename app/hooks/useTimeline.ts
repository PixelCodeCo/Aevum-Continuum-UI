"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

import {
  INITIAL_YEAR_RANGE,
  TIMELINE_CONFIG,
  TIMELINE_MARGIN,
  TIME_PERIODS,
  HUMAN_LIFESPAN_YEARS,
} from "@/app/constants/timeline";
import type { TimelineEvent, TimePeriod } from "@/app/types/timeline";

export function useTimeline(events: TimelineEvent[]) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();
    const width = window.innerWidth;
    const height = window.innerHeight - 50;

    svg.attr("width", width).attr("height", height);

    renderBackground(svg, width, height);

    const xScale = createTimeScale(width);
    const xAxis = createAxis(xScale);

    const g = svg.append("g");
    const axisG = renderAxis(svg, xAxis, height);

    const circles = renderEventDots(g, events, xScale, height);
    const labels = renderEventLabels(g, events, xScale, height);

    const periodsG = renderTimePeriods(svg, TIME_PERIODS, xScale, height);
    const lifespanG = renderLifespanIndicator(svg, xScale, height);

    setupZoom(svg, xScale, xAxis, axisG, circles, labels, periodsG, lifespanG, width);
  }, [events]);

  return svgRef;
}

function renderBackground(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number
) {
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", TIMELINE_CONFIG.colors.background);
}

function createTimeScale(width: number) {
  return d3
    .scaleLinear()
    .domain([INITIAL_YEAR_RANGE.start, INITIAL_YEAR_RANGE.end])
    .range([0, width]);
}

function createAxis(xScale: d3.ScaleLinear<number, number>) {
  return d3
    .axisBottom(xScale)
    .tickFormat((d: d3.NumberValue) => {
      const year = d as number;
      return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    })
    .tickSize(0)
    .tickPadding(12);
}

function renderAxis(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  xAxis: d3.Axis<d3.NumberValue>,
  height: number
) {
  const axisG = svg
    .append("g")
    .attr("transform", `translate(0, ${height - TIMELINE_MARGIN.bottom})`)
    .call(xAxis);

  styleAxis(axisG);

  return axisG;
}

function styleAxis(
  axisG: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  axisG.select(".domain").attr("stroke", TIMELINE_CONFIG.colors.axis);
  axisG
    .selectAll(".tick text")
    .attr("fill", TIMELINE_CONFIG.colors.tickText)
    .attr("font-size", "13px");
}

function renderEventDots(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  events: TimelineEvent[],
  xScale: d3.ScaleLinear<number, number>,
  height: number
) {
  return g
    .selectAll<SVGCircleElement, TimelineEvent>("circle")
    .data(events)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", height / 2)
    .attr("r", 8)
    .attr("fill", TIMELINE_CONFIG.colors.eventDot)
    .attr("cursor", "pointer");
}

function renderEventLabels(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  events: TimelineEvent[],
  xScale: d3.ScaleLinear<number, number>,
  height: number
) {
  return g
    .selectAll<SVGTextElement, TimelineEvent>("text.label")
    .data(events)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.year))
    .attr("y", height / 2 - 16)
    .attr("text-anchor", "middle")
    .attr("fill", TIMELINE_CONFIG.colors.labelText)
    .attr("font-size", "13px")
    .attr("font-family", "system-ui, sans-serif")
    .text((d) => d.title);
}

const PERIOD_BAR_HEIGHT = 14;
const PERIOD_TIER_GAP = 4;
const PERIOD_BASE_Y_OFFSET = 30;
const MIN_WIDTH_FOR_SHORT_LABEL = 40;
const MIN_WIDTH_FOR_FULL_LABEL = 80;

function getPeriodLabel(period: TimePeriod, barWidth: number): string {
  if (barWidth < MIN_WIDTH_FOR_SHORT_LABEL) return "";
  if (barWidth < MIN_WIDTH_FOR_FULL_LABEL) return period.shortName;
  return period.name;
}

function getTierYPosition(tier: number, baseY: number): number {
  return baseY + tier * (PERIOD_BAR_HEIGHT + PERIOD_TIER_GAP);
}

function renderTimePeriods(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  periods: TimePeriod[],
  xScale: d3.ScaleLinear<number, number>,
  height: number
) {
  const periodsG = svg.append("g").attr("class", "time-periods");
  const baseY = height - TIMELINE_MARGIN.bottom + PERIOD_BASE_Y_OFFSET;

  periodsG
    .selectAll<SVGRectElement, TimePeriod>("rect")
    .data(periods)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.startYear))
    .attr("y", (d) => getTierYPosition(d.tier, baseY))
    .attr("width", (d) => Math.max(0, xScale(d.endYear) - xScale(d.startYear)))
    .attr("height", PERIOD_BAR_HEIGHT)
    .attr("fill", (d) => d.color)
    .attr("opacity", 0.85)
    .attr("rx", 2);

  periodsG
    .selectAll<SVGTextElement, TimePeriod>("text")
    .data(periods)
    .enter()
    .append("text")
    .attr("class", "period-label")
    .attr("x", (d) => (xScale(d.startYear) + xScale(d.endYear)) / 2)
    .attr("y", (d) => getTierYPosition(d.tier, baseY) + PERIOD_BAR_HEIGHT / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "9px")
    .attr("font-weight", "500")
    .attr("font-family", "system-ui, sans-serif")
    .attr("pointer-events", "none")
    .text((d) => {
      const barWidth = xScale(d.endYear) - xScale(d.startYear);
      return getPeriodLabel(d, barWidth);
    });

  return periodsG;
}

const MAX_TIERS = 3; // We have tiers 0, 1, 2

function renderLifespanIndicator(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  xScale: d3.ScaleLinear<number, number>,
  height: number
) {
  const lifespanG = svg.append("g").attr("class", "lifespan-indicator");
  const baseY = height - TIMELINE_MARGIN.bottom + PERIOD_BASE_Y_OFFSET;
  const yPosition = baseY + MAX_TIERS * (PERIOD_BAR_HEIGHT + PERIOD_TIER_GAP) + 8;
  const startYear = 2000;
  const endYear = startYear + HUMAN_LIFESPAN_YEARS;

  lifespanG
    .append("line")
    .attr("class", "lifespan-line")
    .attr("x1", xScale(startYear))
    .attr("x2", xScale(endYear))
    .attr("y1", yPosition)
    .attr("y2", yPosition)
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

  lifespanG
    .append("circle")
    .attr("class", "lifespan-start")
    .attr("cx", xScale(startYear))
    .attr("cy", yPosition)
    .attr("r", 4)
    .attr("fill", "#ef4444");

  lifespanG
    .append("circle")
    .attr("class", "lifespan-end")
    .attr("cx", xScale(endYear))
    .attr("cy", yPosition)
    .attr("r", 4)
    .attr("fill", "#ef4444");

  lifespanG
    .append("text")
    .attr("class", "lifespan-label")
    .attr("x", xScale(startYear) - 10)
    .attr("y", yPosition + 4)
    .attr("text-anchor", "end")
    .attr("fill", "#ef4444")
    .attr("font-size", "11px")
    .attr("font-family", "system-ui, sans-serif")
    .text("Human lifespan (80 yrs)");

  return lifespanG;
}

function setupZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  xScale: d3.ScaleLinear<number, number>,
  xAxis: d3.Axis<d3.NumberValue>,
  axisG: d3.Selection<SVGGElement, unknown, null, undefined>,
  circles: d3.Selection<SVGCircleElement, TimelineEvent, SVGGElement, unknown>,
  labels: d3.Selection<SVGTextElement, TimelineEvent, SVGGElement, unknown>,
  periodsG: d3.Selection<SVGGElement, unknown, null, undefined>,
  lifespanG: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number
) {
  const { minYear, maxYear, scaleExtent } = TIMELINE_CONFIG;
  const lifespanStart = 2000;
  const lifespanEnd = lifespanStart + HUMAN_LIFESPAN_YEARS;

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent(scaleExtent)
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const { k, y } = event.transform;
      const { x } = event.transform;

      const minX = width - xScale(maxYear) * k;
      const maxX = -xScale(minYear) * k;
      const constrainedX = Math.max(minX, Math.min(maxX, x));

      // Sync constrained transform back to d3 if it changed
      if (constrainedX !== x) {
        const constrainedTransform = d3.zoomIdentity.translate(constrainedX, y).scale(k);
        svg.call(zoom.transform, constrainedTransform);
        return;
      }

      const newXScale = event.transform.rescaleX(xScale);

      axisG.call(xAxis.scale(newXScale));
      styleAxis(axisG);
      circles.attr("cx", (d) => newXScale(d.year));
      labels.attr("x", (d) => newXScale(d.year));

      // Update time periods
      periodsG
        .selectAll<SVGRectElement, TimePeriod>("rect")
        .attr("x", (d) => newXScale(d.startYear))
        .attr("width", (d) => Math.max(0, newXScale(d.endYear) - newXScale(d.startYear)));

      periodsG
        .selectAll<SVGTextElement, TimePeriod>("text")
        .attr("x", (d) => (newXScale(d.startYear) + newXScale(d.endYear)) / 2)
        .text((d) => {
          const barWidth = newXScale(d.endYear) - newXScale(d.startYear);
          return getPeriodLabel(d, barWidth);
        });

      // Update lifespan indicator
      lifespanG
        .select(".lifespan-line")
        .attr("x1", newXScale(lifespanStart))
        .attr("x2", newXScale(lifespanEnd));

      lifespanG.select(".lifespan-start").attr("cx", newXScale(lifespanStart));
      lifespanG.select(".lifespan-end").attr("cx", newXScale(lifespanEnd));
      lifespanG.select(".lifespan-label").attr("x", newXScale(lifespanStart) - 10);
    });

  svg.call(zoom);
}
