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

    const eventsG = renderEvents(svg, g, events, xScale, height);
    const labels = renderEventLabels(g, events, xScale, height);

    const periodsG = renderTimePeriods(svg, TIME_PERIODS, xScale, height);
    const lifespanG = renderLifespanIndicator(svg, xScale, height, width);

    setupZoom(svg, xScale, xAxis, axisG, eventsG, labels, periodsG, lifespanG, width, events);
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

const EVENT_BAR_HEIGHT = 8;

function isRangeEvent(event: TimelineEvent): boolean {
  return event.endYear !== null && event.endYear !== event.year;
}

function getEventCenterX(event: TimelineEvent, xScale: d3.ScaleLinear<number, number>): number {
  if (isRangeEvent(event)) {
    return (xScale(event.year) + xScale(event.endYear!)) / 2;
  }
  return xScale(event.year);
}

function formatEventDate(event: TimelineEvent): string {
  const startYear = event.year < 0
    ? `${Math.abs(event.year).toLocaleString()} BCE`
    : `${event.year} CE`;

  if (event.endYear && event.endYear !== event.year) {
    const endYear = event.endYear < 0
      ? `${Math.abs(event.endYear).toLocaleString()} BCE`
      : `${event.endYear} CE`;
    return `${startYear} — ${endYear}`;
  }
  return startYear;
}

function renderEvents(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  events: TimelineEvent[],
  xScale: d3.ScaleLinear<number, number>,
  height: number
) {
  const eventsG = g.append("g").attr("class", "events");
  const pointEvents = events.filter((e) => !isRangeEvent(e));
  const rangeEvents = events.filter((e) => isRangeEvent(e));
  const yPosition = height / 2;

  // Create tooltip
  const tooltip = svg.append("g")
    .attr("class", "event-tooltip")
    .attr("visibility", "hidden")
    .attr("pointer-events", "none");

  tooltip.append("rect")
    .attr("class", "tooltip-bg")
    .attr("fill", "#1f2937")
    .attr("rx", 6)
    .attr("ry", 6);

  tooltip.append("text")
    .attr("class", "tooltip-title")
    .attr("fill", "#fff")
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .attr("font-family", "system-ui, sans-serif");

  tooltip.append("text")
    .attr("class", "tooltip-date")
    .attr("fill", "#9ca3af")
    .attr("font-size", "11px")
    .attr("font-family", "system-ui, sans-serif");

  tooltip.append("text")
    .attr("class", "tooltip-summary")
    .attr("fill", "#d1d5db")
    .attr("font-size", "11px")
    .attr("font-family", "system-ui, sans-serif");

  const showTooltip = (event: MouseEvent, d: TimelineEvent) => {
    const titleText = tooltip.select(".tooltip-title").text(d.title);
    const dateText = tooltip.select(".tooltip-date").text(formatEventDate(d));
    const summaryText = tooltip.select(".tooltip-summary")
      .text(d.summary ? (d.summary.length > 60 ? d.summary.slice(0, 60) + "..." : d.summary) : "");

    const titleBox = (titleText.node() as SVGTextElement).getBBox();
    const dateBox = (dateText.node() as SVGTextElement).getBBox();
    const summaryBox = d.summary ? (summaryText.node() as SVGTextElement).getBBox() : { width: 0, height: 0 };

    const padding = 10;
    const lineSpacing = 4;
    const bgWidth = Math.max(titleBox.width, dateBox.width, summaryBox.width) + padding * 2;
    const bgHeight = titleBox.height + dateBox.height + (d.summary ? summaryBox.height + lineSpacing : 0) + padding * 2 + lineSpacing;

    const [mx, my] = d3.pointer(event, svg.node());
    const tooltipX = mx - bgWidth / 2;
    const tooltipY = my - bgHeight - 12;

    tooltip
      .attr("transform", `translate(${tooltipX}, ${tooltipY})`)
      .attr("visibility", "visible");

    tooltip.select(".tooltip-bg")
      .attr("width", bgWidth)
      .attr("height", bgHeight);

    tooltip.select(".tooltip-title")
      .attr("x", padding)
      .attr("y", padding + titleBox.height - 2);

    tooltip.select(".tooltip-date")
      .attr("x", padding)
      .attr("y", padding + titleBox.height + dateBox.height + lineSpacing);

    if (d.summary) {
      tooltip.select(".tooltip-summary")
        .attr("x", padding)
        .attr("y", padding + titleBox.height + dateBox.height + summaryBox.height + lineSpacing * 2);
    }
  };

  const moveTooltip = (event: MouseEvent) => {
    const [mx, my] = d3.pointer(event, svg.node());
    const bgWidth = (tooltip.select(".tooltip-bg").node() as SVGRectElement).getBBox().width;
    const bgHeight = (tooltip.select(".tooltip-bg").node() as SVGRectElement).getBBox().height;
    tooltip.attr("transform", `translate(${mx - bgWidth / 2}, ${my - bgHeight - 12})`);
  };

  const hideTooltip = () => {
    tooltip.attr("visibility", "hidden");
  };

  // Render range events as bars
  eventsG
    .selectAll<SVGRectElement, TimelineEvent>("rect.event-bar")
    .data(rangeEvents)
    .enter()
    .append("rect")
    .attr("class", "event-bar")
    .attr("x", (d) => xScale(d.year))
    .attr("y", yPosition - EVENT_BAR_HEIGHT / 2)
    .attr("width", (d) => Math.max(0, xScale(d.endYear!) - xScale(d.year)))
    .attr("height", EVENT_BAR_HEIGHT)
    .attr("fill", TIMELINE_CONFIG.colors.eventDot)
    .attr("rx", EVENT_BAR_HEIGHT / 2)
    .attr("cursor", "pointer")
    .on("mouseenter", function(event: MouseEvent, d: TimelineEvent) {
      d3.select(this).attr("opacity", 0.8);
      showTooltip(event, d);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).attr("opacity", 1);
      hideTooltip();
    });

  // Render start/end markers for range events
  eventsG
    .selectAll<SVGCircleElement, TimelineEvent>("circle.event-start")
    .data(rangeEvents)
    .enter()
    .append("circle")
    .attr("class", "event-start")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", yPosition)
    .attr("r", 5)
    .attr("fill", TIMELINE_CONFIG.colors.eventDot);

  eventsG
    .selectAll<SVGCircleElement, TimelineEvent>("circle.event-end")
    .data(rangeEvents)
    .enter()
    .append("circle")
    .attr("class", "event-end")
    .attr("cx", (d) => xScale(d.endYear!))
    .attr("cy", yPosition)
    .attr("r", 5)
    .attr("fill", TIMELINE_CONFIG.colors.eventDot);

  // Render point events as dots
  eventsG
    .selectAll<SVGCircleElement, TimelineEvent>("circle.event-dot")
    .data(pointEvents)
    .enter()
    .append("circle")
    .attr("class", "event-dot")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", yPosition)
    .attr("r", 8)
    .attr("fill", TIMELINE_CONFIG.colors.eventDot)
    .attr("cursor", "pointer")
    .on("mouseenter", function(event: MouseEvent, d: TimelineEvent) {
      d3.select(this).attr("r", 10);
      showTooltip(event, d);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).attr("r", 8);
      hideTooltip();
    });

  return eventsG;
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
    .attr("x", (d) => getEventCenterX(d, xScale))
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

function formatYearForTooltip(year: number): string {
  if (year < 0) return `${Math.abs(year).toLocaleString()} BCE`;
  return `${year} CE`;
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

  // Create tooltip group (hidden by default)
  const tooltip = svg.append("g")
    .attr("class", "period-tooltip")
    .attr("visibility", "hidden")
    .attr("pointer-events", "none");

  tooltip.append("rect")
    .attr("class", "tooltip-bg")
    .attr("fill", "#1f2937")
    .attr("rx", 4)
    .attr("ry", 4);

  tooltip.append("text")
    .attr("class", "tooltip-name")
    .attr("fill", "#fff")
    .attr("font-size", "11px")
    .attr("font-weight", "600")
    .attr("font-family", "system-ui, sans-serif");

  tooltip.append("text")
    .attr("class", "tooltip-dates")
    .attr("fill", "#9ca3af")
    .attr("font-size", "10px")
    .attr("font-family", "system-ui, sans-serif");

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
    .attr("rx", 2)
    .attr("cursor", "pointer")
    .on("mouseenter", function (event: MouseEvent, d: TimePeriod) {
      d3.select(this).attr("opacity", 1);

      const nameText = tooltip.select(".tooltip-name").text(d.name);
      const datesText = tooltip.select(".tooltip-dates")
        .text(`${formatYearForTooltip(d.startYear)} — ${formatYearForTooltip(d.endYear)}`);

      const nameBox = (nameText.node() as SVGTextElement).getBBox();
      const datesBox = (datesText.node() as SVGTextElement).getBBox();
      const padding = 8;
      const bgWidth = Math.max(nameBox.width, datesBox.width) + padding * 2;
      const bgHeight = nameBox.height + datesBox.height + padding * 2 + 2;

      const [mx, my] = d3.pointer(event, svg.node());
      const tooltipX = mx - bgWidth / 2;
      const tooltipY = my - bgHeight - 8;

      tooltip
        .attr("transform", `translate(${tooltipX}, ${tooltipY})`)
        .attr("visibility", "visible");

      tooltip.select(".tooltip-bg")
        .attr("width", bgWidth)
        .attr("height", bgHeight);

      tooltip.select(".tooltip-name")
        .attr("x", padding)
        .attr("y", padding + nameBox.height - 2);

      tooltip.select(".tooltip-dates")
        .attr("x", padding)
        .attr("y", padding + nameBox.height + datesBox.height + 2);
    })
    .on("mousemove", function (event: MouseEvent) {
      const [mx, my] = d3.pointer(event, svg.node());
      const bgWidth = (tooltip.select(".tooltip-bg").node() as SVGRectElement).getBBox().width;
      const bgHeight = (tooltip.select(".tooltip-bg").node() as SVGRectElement).getBBox().height;
      tooltip.attr("transform", `translate(${mx - bgWidth / 2}, ${my - bgHeight - 8})`);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 0.85);
      tooltip.attr("visibility", "hidden");
    });

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

function calculateLifespanWidth(xScale: d3.ScaleLinear<number, number>): number {
  const domain = xScale.domain();
  const range = xScale.range();
  const pixelsPerYear = (range[1] - range[0]) / (domain[1] - domain[0]);
  return Math.abs(pixelsPerYear * HUMAN_LIFESPAN_YEARS);
}

function renderLifespanIndicator(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  xScale: d3.ScaleLinear<number, number>,
  height: number,
  width: number
) {
  const lifespanG = svg.append("g").attr("class", "lifespan-indicator");
  const baseY = height - TIMELINE_MARGIN.bottom + PERIOD_BASE_Y_OFFSET;
  const yPosition = baseY + MAX_TIERS * (PERIOD_BAR_HEIGHT + PERIOD_TIER_GAP) + 8;

  const lifespanWidth = calculateLifespanWidth(xScale);
  const centerX = width * 0.75;
  const startX = centerX - lifespanWidth / 2;
  const endX = centerX + lifespanWidth / 2;

  lifespanG
    .append("line")
    .attr("class", "lifespan-line")
    .attr("x1", startX)
    .attr("x2", endX)
    .attr("y1", yPosition)
    .attr("y2", yPosition)
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

  lifespanG
    .append("circle")
    .attr("class", "lifespan-start")
    .attr("cx", startX)
    .attr("cy", yPosition)
    .attr("r", 4)
    .attr("fill", "#ef4444");

  lifespanG
    .append("circle")
    .attr("class", "lifespan-end")
    .attr("cx", endX)
    .attr("cy", yPosition)
    .attr("r", 4)
    .attr("fill", "#ef4444");

  lifespanG
    .append("text")
    .attr("class", "lifespan-label")
    .attr("x", startX - 10)
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
  eventsG: d3.Selection<SVGGElement, unknown, null, undefined>,
  labels: d3.Selection<SVGTextElement, TimelineEvent, SVGGElement, unknown>,
  periodsG: d3.Selection<SVGGElement, unknown, null, undefined>,
  lifespanG: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  events: TimelineEvent[]
) {
  const { minYear, maxYear, scaleExtent } = TIMELINE_CONFIG;
  const pointEvents = events.filter((e) => !isRangeEvent(e));
  const rangeEvents = events.filter((e) => isRangeEvent(e));

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

      eventsG
        .selectAll<SVGCircleElement, TimelineEvent>("circle.event-dot")
        .data(pointEvents)
        .attr("cx", (d) => newXScale(d.year));

      eventsG
        .selectAll<SVGRectElement, TimelineEvent>("rect.event-bar")
        .data(rangeEvents)
        .attr("x", (d) => newXScale(d.year))
        .attr("width", (d) => Math.max(0, newXScale(d.endYear!) - newXScale(d.year)));

      eventsG
        .selectAll<SVGCircleElement, TimelineEvent>("circle.event-start")
        .data(rangeEvents)
        .attr("cx", (d) => newXScale(d.year));

      eventsG
        .selectAll<SVGCircleElement, TimelineEvent>("circle.event-end")
        .data(rangeEvents)
        .attr("cx", (d) => newXScale(d.endYear!));

      labels.attr("x", (d) => getEventCenterX(d, newXScale));

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

      // Calculate exact lifespan width at current zoom level
      const lifespanWidth = calculateLifespanWidth(newXScale);
      const centerX = width * 0.75;
      const startX = centerX - lifespanWidth / 2;
      const endX = centerX + lifespanWidth / 2;

      lifespanG
        .select(".lifespan-line")
        .attr("x1", startX)
        .attr("x2", endX);

      lifespanG.select(".lifespan-start").attr("cx", startX);
      lifespanG.select(".lifespan-end").attr("cx", endX);
      lifespanG.select(".lifespan-label").attr("x", startX - 10);
    });

  svg.call(zoom);
}
