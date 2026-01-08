"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

import {
  INITIAL_YEAR_RANGE,
  TIMELINE_CONFIG,
  TIMELINE_MARGIN,
} from "@/app/constants/timeline";
import type { TimelineEvent } from "@/app/types/timeline";

export function useTimeline(events: TimelineEvent[]) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();
    const width = window.innerWidth;
    const height = window.innerHeight - 100;

    svg.attr("width", width).attr("height", height);

    renderBackground(svg, width, height);

    const xScale = createTimeScale(width);
    const xAxis = createAxis(xScale);

    const g = svg.append("g");
    const axisG = renderAxis(svg, xAxis, height);

    const circles = renderEventDots(g, events, xScale, height);
    const labels = renderEventLabels(g, events, xScale, height);

    setupZoom(svg, xScale, xAxis, axisG, circles, labels, width);
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

function setupZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  xScale: d3.ScaleLinear<number, number>,
  xAxis: d3.Axis<d3.NumberValue>,
  axisG: d3.Selection<SVGGElement, unknown, null, undefined>,
  circles: d3.Selection<SVGCircleElement, TimelineEvent, SVGGElement, unknown>,
  labels: d3.Selection<SVGTextElement, TimelineEvent, SVGGElement, unknown>,
  width: number
) {
  const { minYear, maxYear, scaleExtent } = TIMELINE_CONFIG;

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent(scaleExtent)
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const { k, y } = event.transform;
      let { x } = event.transform;

      const minX = width - xScale(maxYear) * k;
      const maxX = -xScale(minYear) * k;
      x = Math.max(minX, Math.min(maxX, x));

      const constrainedTransform = d3.zoomIdentity.translate(x, y).scale(k);
      const newXScale = constrainedTransform.rescaleX(xScale);

      axisG.call(xAxis.scale(newXScale));
      styleAxis(axisG);
      circles.attr("cx", (d) => newXScale(d.year));
      labels.attr("x", (d) => newXScale(d.year));
    });

  svg.call(zoom);
}
