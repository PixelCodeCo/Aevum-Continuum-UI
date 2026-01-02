"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface Event {
  title: string;
  year: number;
}

export default function Home() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = { bottom: 80 };

    svg.attr("width", width).attr("height", height);

    // Light background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fafafa");

    // Time scale
    const xScale = d3.scaleLinear().domain([-3000, 2025]).range([0, width]);

    // Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d: d3.NumberValue) => {
        const year = d as number;
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
      })
      .tickSize(0)
      .tickPadding(12);

    const g = svg.append("g");

    // Axis container
    const axisG = svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    // Style the axis
    axisG.select(".domain").attr("stroke", "#e5e5e5");
    axisG
      .selectAll(".tick text")
      .attr("fill", "#888")
      .attr("font-size", "13px");

    const testEvents: Event[] = [
      { title: "Pyramids of Giza", year: -2560 },
      { title: "Fall of Rome", year: 476 },
      { title: "Battle of Hastings", year: 1066 },
      { title: "French Revolution", year: 1789 },
      { title: "World War II", year: 1939 },
    ];

    const circles = g
      .selectAll<SVGCircleElement, Event>("circle")
      .data(testEvents)
      .enter()
      .append("circle")
      .attr("cx", (d: Event) => xScale(d.year))
      .attr("cy", height / 2)
      .attr("r", 8)
      .attr("fill", "#6366f1")
      .attr("cursor", "pointer");

    const labels = g
      .selectAll<SVGTextElement, Event>("text.label")
      .data(testEvents)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d: Event) => xScale(d.year))
      .attr("y", height / 2 - 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .attr("font-size", "13px")
      .attr("font-family", "system-ui, sans-serif")
      .text((d: Event) => d.title);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 100])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const newXScale = event.transform.rescaleX(xScale);
        axisG.call(xAxis.scale(newXScale));
        axisG.select(".domain").attr("stroke", "#e5e5e5");
        axisG
          .selectAll(".tick text")
          .attr("fill", "#888")
          .attr("font-size", "13px");
        circles.attr("cx", (d: Event) => newXScale(d.year));
        labels.attr("x", (d: Event) => newXScale(d.year));
      });

    svg.call(zoom);
  }, []);

  return <svg ref={svgRef}></svg>;
}
