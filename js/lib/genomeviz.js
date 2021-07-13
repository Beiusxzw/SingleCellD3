(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
        (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.genomeviz = global.genomeviz || {}));
}(this, (function(exports) {
    'use strict';

    var version = "1.0.0";

    function clearGenomeViz(target) {
        $(target).empty()
    }

    function createGenomeViz(target, chrom, genemin, genemax, data) {
        var margin = {
            top: 20,
            bottom: 20,
            left: 0,
            right: 15
        };
        var width = 1000 - margin.left - margin.right;
        const height = 100 - margin.top - margin.bottom;


        var xScale = d3.scaleLinear().domain([genemin, genemax]).range([0, width]);
        var yScale = d3.scaleLinear().domain([0, 100]).range([0, height]);
        var xAxis = d3.axisBottom(xScale).ticks(10);
        var xAxisGrid = d3.axisBottom(xScale).ticks(10).tickSize(-height, 0, 0).tickFormat("");
        var sExtM = width / Math.abs(xScale(100) - xScale(1));

        // Add brushing
        var brush = d3.brushX() // Add the brush feature using the d3.brush function
            .extent([
                [0, 0],
                [width, height]
            ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function


        var svg = d3.select(target)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("viewBox", [width, height * 1.2, width, height * 2]);
        svg.append("g")
            .attr("class", "brush")
            .call(brush);

        var gX = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis);

        function getY(d) {
            if (d.feature == "exon") { return 20 } else if (d.feature == "gene") { return 20 } else if (d.feature == "transcript") { return 20 } else if (d.feature == "CDS") { return 20 } else if (d.feature == "stop_codon") { return 20 } else if (d.feature == "three_prime_utr") { return 20 } else if (d.feature == "te") { return 40 } else if (d.feature == "grna") { return 10 }
        }

        function getHeight(d) {
            if (d.feature == "grna") { return 5 } else if (d.feature == "CDS") { return 15 } else if (d.feature == "stop_codon") { return 15 } else if (d.feature == "three_prime_utr") { return 10 } else { return 10 }
        }

        function getColor(d) {
            if (d.feature == "exon") { return '#0E0080' } else if (d.feature == "gene") { return '#0E0080' } else if (d.feature == "CDS") { return '#0E0080' } else if (d.feature == "transcript") { return '#0E0080' } else if (d.feature == "stop_codon") { return '#000' } else if (d.feature == "three_prime_utr") { return '#000' } else if (d.feature == "te") { return '#479AB3' } else if (d.feature == "grna") { return 'red' }
        }

        svg.selectAll("gene")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "gtf-rect")
            .attr('x', d => xScale(d.start))
            .attr('y', d => yScale(getY(d)))
            .attr('width', d => xScale(d.end) - xScale(d.start))
            .attr('height', d => getHeight(d))
            .attr('fill', d => getColor(d))
            .attr("title", d => d.feature)
            .on("mouseover", function(d, i) {
                d3.select(this).transition()
                    .duration('100')
                    .attr("fill", "#3598DB")

            }).on("mouseout", function(d, i) {
                d3.select(this).transition()
                    .duration('100')
                    .attr("fill", d => getColor(d))

            });

        svg.selectAll("name")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "gtf-text")
            .attr('x', d => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
            .attr('y', d => yScale(getY(d) - 5))
            .attr('font-size', '6pt')
            .text(d => d.name)

        var data_forward = Array();
        data.map(function(d) {
            if (d.strand == "+") data_forward.push(d);
        })
        var data_reverse = Array();
        data.map(function(d) {
            if (d.strand == "-") data_reverse.push(d);
        })

        svg.selectAll("marker")
            .data(data_forward)
            .enter()
            .append("g")
            .attr("class", "forward")
            .attr("transform", function(d) { return ("translate(" + xScale(d.end) + "," + yScale(getY(d)) + ")") })
            .append("path")
            .attr("id", "forward_arrow")
            .attr("x0", d => xScale(d.end))
            .attr("y0", d => yScale(getY(d)))
            .attr("d", d => "M 0,0 V" + getHeight(d) + "L" + getHeight(d) / 2 + "," + getHeight(d) / 2 + " Z"); //this is actual shape for arrowhead

        svg.selectAll("marker")
            .data(data_reverse)
            .enter()
            .append("g")
            .attr("class", "reverse")
            .attr("transform", function(d) { return ("translate(" + xScale(d.start) + "," + yScale(getY(d)) + ")") })
            .append("path")
            .attr("id", "forward_arrow")
            .attr("x0", d => xScale(d.start))
            .attr("y0", d => yScale(getY(d)))
            .attr("d", d => "M 0,0 V" + getHeight(d) + "L" + -getHeight(d) / 2 + "," + getHeight(d) / 2 + "Z "); //this is actual shape for arrowhead
        var idleTimeout

        function idled() { idleTimeout = null; }

        function updateChart(event) {

            extent = event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                xScale.domain([genemin, genemax])
            } else {
                xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])])
                svg.selectAll("gene").select(".brush").call(brush.move, null)
            }

            gX.transition().duration(1000).call(d3.axisBottom(xScale))

            svg.selectAll(".gtf-rect").transition().duration(1000)
                .attr('x', d => xScale(d.start))
                .attr('width', function(d) { return xScale(d.end) - xScale(d.start) })

            svg.selectAll(".forward").transition().duration(1000)
                .attr("transform", function(d) { return ("translate(" + xScale(d.end) + "," + yScale(getY(d)) + ")") })
            svg.selectAll(".reverse").transition().duration(1000)
                .attr("transform", function(d) { return ("translate(" + xScale(d.start) + "," + yScale(getY(d)) + ")") })
            svg.selectAll(".gtf-text").transition().duration(1000)
                .attr('x', d => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
                .attr('y', d => yScale(getY(d) - 5))
        }

        var legend = svg.append("g");
        legend.append("rect").attr("x", 8).attr("y", 0).attr("width", 100).attr("height", 55).attr("stroke", "black").attr("stroke-width", 0.5).attr("fill", "white").style("z-index", 100000);
        legend.append("text").text("5' =>  3'").attr("x", 40).attr("y", 13).attr("font-family", "arial").attr("font-size", "11px").attr("fill", "black").attr("z-index", 100000);

        legend.append("line").attr("x1", 15).attr("x2", 45).attr("y1", 22).attr("y2", 22).attr("stroke-width", 10).attr("stroke", "#479AB3").attr("z-index", 100000);
        legend.append("text").text("TE").attr("x", 50).attr("y", 25).attr("font-family", "arial").attr("font-size", "10px").attr("fill", "black").attr("z-index", 100000);

        legend.append("line").attr("x1", 15).attr("x2", 45).attr("y1", 34.5).attr("y2", 34.5).attr("stroke-width", 10).attr("stroke", "#0E0080").attr("z-index", 100000);
        legend.append("text").text("Genes").attr("x", 50).attr("y", 37.5).attr("font-family", "arial").attr("font-size", "10px").attr("fill", "black").attr("z-index", 100000);

        legend.append("line").attr("x1", 15).attr("x2", 45).attr("y1", 47).attr("y2", 47).attr("stroke-width", 8).attr("stroke", "red").attr("z-index", 100000);
        legend.append("text").text("gRNA").attr("x", 50).attr("y", 50).attr("font-family", "arial").attr("font-size", "10px").attr("fill", "black").attr("z-index", 100000);
        legend.append("text").text("chromosome" + chrom).attr("x", width / 2).attr("y", 0).attr("font-family", "arial").attr("font-size", "12px").attr("font-weight", 600).attr("fill", "black").attr("z-index", 100000);
        legend.append("text").text("Select to zoom. Double-click to recover").attr("x", width - 200).attr("y", height - 10).attr("font-family", "arial").attr("font-size", "8px").attr("fill", "black").attr("z-index", 100000);
    }

    function createPie(target, color, data) {
        var total = Object.values(data).reduce((a, b) => a + b, 0).toString();
        var data = Object.entries(data).map(d => ({
            name: d[0],
            value: d[1]
        }))

        var color = color
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

        var arc = d3.arc()
            .innerRadius(10)
            .outerRadius(Math.min(width, height) / 2 - 1)

        const radius = Math.min(width, height) / 2 * 0.8;
        var arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);
        var pie = d3.pie()
            .sort(null)
            .value(d => d.value)

        const arcs = pie(data);

        const svg = d3.select(target).append("svg")
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        svg.append("g")
            .attr("stroke", "white")
            .attr("stroke-width", ".2pt")
            .selectAll("path")
            .data(arcs)
            .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
            .transition()
            .duration(2000)

        var mm_tooltip = createTooltip(target);
        var sum = Object.values(data).map(d => d.value).reduce((a, b) => a + b, 0);

        svg.selectAll("path").on("mouseover", function(d, i) {
            d3.select(this).transition()
                .duration('100')
                .attr("stroke-width", ".1pt")
            mm_tooltip.transition()
                .duration(200)
                .style("opacity", 1)
            mm_tooltip.html(`${i.data.name}: ${i.data.value.toLocaleString()}` + " (" + (100 * i.data.value / sum).toFixed(2) + "%)");
        })
        svg.selectAll("path").on("mouseout", function(d, i) {
            d3.select(this).transition()
                .duration('100')
                .attr("stroke-width", ".2pt")
            mm_tooltip.transition()
                .duration(200).style("opacity", 0);
        })

        svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 0)
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(arcs)
            .join("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .text(d => d.data.name))
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => d.data.value.toLocaleString()));

        svg.append("text")
            .attr('x', -8)
            .attr('y', 0)
            .text("Total = " + total)
            .attr("fill", "black")
            .style("font-size", "2pt")
            .style("font-weight", 900);
    }

    function createTooltip(target) {
        var tooltip = d3.select(target).append("div")
            .attr("class", "hov-tooltip")
            .style("opacity", 0)
            .style('z-index', '1000')
        return tooltip
    }
    exports.clearGenomeViz = clearGenomeViz;
    exports.createGenomeViz = createGenomeViz;
    exports.createTooltip = createTooltip;
    exports.createPie = createPie;
})));