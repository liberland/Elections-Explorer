<script lang="ts">
  import type { PageProps } from "./$types";
  import type { AccountInfo } from "$lib/types";
  import { scaleScore, scaleStake } from "$lib/aux";
  import {
    formatAccountLabel,
    formatScore,
    formatStake,
  } from "$lib/formatters";
  import { onMount } from "svelte";
  import * as echarts from "echarts/core";
  import { BarChart, LineChart, ScatterChart } from "echarts/charts";
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
    ToolboxComponent,
    MarkLineComponent,
    MarkAreaComponent,
  } from "echarts/components";
  import { LabelLayout, UniversalTransition } from "echarts/features";
  import { CanvasRenderer } from "echarts/renderers";

  // Register ECharts components
  echarts.use([
    BarChart,
    LineChart,
    ScatterChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer,
    ToolboxComponent,
    MarkLineComponent,
    MarkAreaComponent,
  ]);

  // Get the data from the props
  const { electionData } = $props();
  // State variables
  let activeTab = $state("results");

  // Chart instances storage
  const chartInstances = new Map();

  // Window resize handler
  onMount(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  function handleResize() {
    chartInstances.forEach((chart) => chart.resize());
  }

  // Svelte action for ECharts
  function echartAction(node, options) {
    const chart = echarts.init(node);
    chart.setOption(options);
    chartInstances.set(node, chart);

    return {
      update(newOptions) {
        chart.setOption(newOptions, true);
      },
      destroy() {
        chart.dispose();
        chartInstances.delete(node);
      },
    };
  }

  // Chart config for "Election Results"
  function getElectionResultsOptions() {
    // Sort and scale scores
    const sortedResults_unscaled = [...electionData.finalResults].sort(
      (a, b) => a.finalScore - b.finalScore,
    );
    const sortedResults = sortedResults_unscaled.map((result) => ({
      ...result,
      finalScore: scaleScore(result.finalScore),
    }));

    // Extract candidate names
    const candidates = sortedResults.map((result) => {
      if (result.id.displayName !== undefined) {
        return result.id.displayName;
      } else {
        return result.id.address;
      }
    });

    // Data transform
    const scores = sortedResults.map((result) => ({
      value: result.finalScore, // Scale for visibility
      itemStyle: {
        color:
          result.role === "Member"
            ? "#2563eb"
            : result.role === "RunnerUp"
              ? "#7c3aed"
              : "#94a3b8",
      },
    }));

    // Find actual threshold values by looking at the roles
    const memberThreshold = sortedResults.findLast(
      (r) => r.role === "Member",
    )?.finalScore;
    const runnerUpThreshold = sortedResults.findLast(
      (r) => r.role === "RunnerUp",
    )?.finalScore;

    return {
      title: {
        text: "Election Results",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          const dataIndex = params[0].dataIndex;
          const result = sortedResults[dataIndex];
          return `
            <strong>${result.id.displayName ? result.id.displayName : result.id.address}</strong><br>
            Score: ${formatScore(result.finalScore)}<br>
            Role: ${result.role}<br>
            Initial Stake: ${formatStake(scaleStake(result.initialStake))}<br>
            Final Stake: ${formatStake(scaleStake(result.finalStake))}
          `;
        },
      },
      grid: {
        show: true,
        top: "10%",
        bottom: "3%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: candidates,
        axisLabel: {
          formatter: formatAccountLabel,
          fontSize: 14,
          interval: 0,
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "Score",
      },
      series: [
        {
          name: "Score",
          type: "bar",
          data: scores,
          markLine: {
            silent: false,
            lineStyle: {
              color: "#2563eb",
              type: "dashed",
              width: 1,
            },
            symbol: "none",
            data: [
              {
                yAxis: memberThreshold,
                label: {
                  formatter: "Member Threshold",
                  position: "insideEndTop",
                  distance: 5,
                },
              },
              {
                yAxis: runnerUpThreshold,
                label: {
                  formatter: "RunnerUp Threshold",
                  position: "insideEndTop",
                  distance: 5,
                },
              },
            ],
          },
        },
        {
          name: "Sections",
          type: "bar",
          itemStyle: { opacity: 0 },
          markArea: {
            silent: true,
            data: [
              [
                {
                  name: "Members",
                  xAxis: -0.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(37, 99, 235, 0.05)",
                    borderColor: "#2563eb",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: 6.5,
                  yAxis: "max",
                },
              ],
              [
                {
                  name: "Runners Up",
                  xAxis: 6.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(124, 58, 237, 0.05)",
                    borderColor: "#7c3aed",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: 13.5,
                  yAxis: "max",
                },
              ],
              [
                {
                  name: "Not Elected",
                  xAxis: 13.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(148, 163, 184, 0.05)",
                    borderColor: "#94a3b8",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: candidates.length - 0.5,
                  yAxis: "max",
                },
              ],
            ],
          },
        },
      ],
    };
  }

  function getStakeComparisonOptions() {
    // Sort by score to maintain the same order as results chart
    const sortedResults_unscaled = [...electionData.finalResults].sort(
      (a, b) => a.finalScore - b.finalScore,
    );
    const sortedResults = sortedResults_unscaled.map((item) => ({
      ...item,
      finalScore: scaleScore(item.finalScore),
      initialStake: scaleStake(item.initialStake),
      finalStake: scaleStake(item.finalStake),
    }));

    // Extract candidate names
    const candidates = sortedResults.map((result) => {
      if (result.id.displayName !== undefined) {
        return result.id.displayName;
      } else {
        return result.id.address;
      }
    });

    return {
      title: {
        text: "Initial Stake vs. Final Applied Stake",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          const dataIndex = params[0].dataIndex;
          const result = sortedResults[dataIndex];
          return `
            <strong>${result.id.displayName ? result.id.displayName : result.id.address}</strong><br>
            Role: ${result.role}<br>
            Initial Stake: ${formatStake(params[0].value)}<br>
            Final Stake: ${formatStake(params[1].value)}<br>
            Difference: ${formatStake(params[0].value - params[1].value)}
          `;
        },
      },
      // legend: {
      //   data: ["Initial Stake", "Final Applied Stake"],
      //   bottom: 10,
      // },
      grid: {
        show: true,
        top: "10%",
        bottom: "3%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: candidates,
        axisLabel: {
          formatter: formatAccountLabel,
          fontSize: 14,
          interval: 0,
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "Stake Amount",
      },
      series: [
        {
          name: "Initial Stake",
          type: "bar",
          itemStyle: {
            color: function (params) {
              const result = sortedResults[params.dataIndex];
              return result.role === "Member"
                ? "#93c5fd"
                : result.role === "RunnerUp"
                  ? "#c4b5fd"
                  : "#cbd5e1";
            },
          },
          data: sortedResults.map((result) => result.initialStake),
        },
        {
          name: "Final Applied Stake",
          type: "bar",
          itemStyle: {
            color: function (params) {
              const result = sortedResults[params.dataIndex];
              return result.role === "Member"
                ? "#2563eb"
                : result.role === "RunnerUp"
                  ? "#7c3aed"
                  : "#94a3b8";
            },
          },
          data: sortedResults.map((result) => result.finalStake),
        },
        {
          name: "Sections",
          type: "bar",
          itemStyle: { opacity: 0 },
          markArea: {
            silent: true,
            data: [
              [
                {
                  name: "Members",
                  xAxis: -0.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(37, 99, 235, 0.05)",
                    borderColor: "#2563eb",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: 6.5,
                  yAxis: "max",
                },
              ],
              [
                {
                  name: "Runners Up",
                  xAxis: 6.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(124, 58, 237, 0.05)",
                    borderColor: "#7c3aed",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: 13.5,
                  yAxis: "max",
                },
              ],
              [
                {
                  name: "Not Elected",
                  xAxis: 13.5,
                  yAxis: "min",
                  itemStyle: {
                    color: "rgba(148, 163, 184, 0.05)",
                    borderColor: "#94a3b8",
                    borderWidth: 1,
                    borderType: "dashed",
                  },
                },
                {
                  xAxis: sortedResults.length - 0.5,
                  yAxis: "max",
                },
              ],
            ],
          },
        },
      ],
    };
  }

  function getScatterPlotOptions() {
    const data = electionData.finalResults.map((result) => ({
      name: result.id.displayName ? result.id.displayName : result.id.address,
      value: [
        scaleStake(result.initialStake),
        scaleScore(result.finalScore),
        scaleStake(result.finalStake),
      ],
      role: result.role,
    }));

    return {
      title: {
        text: "Election Score vs Initial Stake",
        left: "center",
      },
      tooltip: {
        formatter: function (params) {
          return `
            <strong>${params.data.name}</strong><br>
            Role: ${params.data.role}<br>
            Initial Stake: ${formatStake(params.data.value[0])}<br>
            Final Stake: ${formatStake(params.data.value[2])}<br>
            Final Score: ${formatScore(params.data.value[1])}
          `;
        },
      },
      legend: {
        data: ["Members", "Runners Up", "Not Elected"],
        bottom: 10,
      },
      grid: {
        show: true,
        top: "10%",
        bottom: "8%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "Initial Stake",
        scale: true,
      },
      yAxis: {
        type: "value",
        name: "Score (scaled)",
        scale: true,
      },
      series: [
        {
          name: "Members",
          type: "scatter",
          symbolSize: 20,
          itemStyle: { color: "#2563eb" },
          data: data.filter((item) => item.role === "Member"),
          label: {
            show: false,
            position: "right",
            formatter: function (param) {
              return param.data.name;
            },
            fontSize: 12,
          },
        },
        {
          name: "Runners Up",
          type: "scatter",
          symbolSize: 20,
          itemStyle: { color: "#7c3aed" },
          data: data.filter((item) => item.role === "RunnerUp"),
          label: {
            show: false,
            position: "right",
            formatter: function (param) {
              return param.data.name;
            },
            fontSize: 12,
          },
        },
        {
          name: "Not Elected",
          type: "scatter",
          symbolSize: 20,
          itemStyle: { color: "#94a3b8" },
          data: data.filter((item) => item.role === "NotElected"),
          label: {
            show: false,
            position: "right",
            formatter: function (param) {
              return param.data.name;
            },
            fontSize: 12,
          },
        },
      ],
    };
  }

  function getRoundProgressionOptions() {
    // Prepare data for progression chart
    // const candidates = electionData.finalResults.map((r) => r.id.address);
    const progressionData = [];

    // Extract candidate names
    const candidates = electionData.finalResults.map((result) => {
      if (result.id.displayName !== undefined) {
        return result.id.displayName;
      } else {
        return result.id.address;
      }
    });

    // Extract data for each round
    for (let i = 0; i < electionData.rounds.length; i++) {
      const round = electionData.rounds[i];
      const dataPoint = { round: `Round ${round.roundNumber}` };

      round.scores.forEach((score) => {
        dataPoint[
          score.id.displayName ? score.id.displayName : score.id.address
        ] = scaleScore(score.score); // Scale for visibility
      });

      progressionData.push(dataPoint);
    }

    // Determine the roles for color coding
    const roles = {};
    electionData.finalResults.forEach((result) => {
      roles[result.id.displayName ? result.id.displayName : result.id.address] =
        result.role;
    });

    // Create series for each candidate
    const series = candidates.map((candidate) => {
      return {
        name: candidate,
        type: "line",
        smooth: true,
        emphasis: { focus: "series" },
        data: progressionData.map((round) => round[candidate]),
        lineStyle: {
          width: 1,
          type: "solid",
          color:
            roles[candidate] === "Member"
              ? "#2563eb"
              : roles[candidate] === "RunnerUp"
                ? "#7c3aed"
                : "#94a3b8",
        },
        itemStyle: {
          color:
            roles[candidate] === "Member"
              ? "#2563eb"
              : roles[candidate] === "RunnerUp"
                ? "#7c3aed"
                : "#94a3b8",
        },
      };
    });

    return {
      title: {
        text: "Candidate Score Progression Across Rounds",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params) {
          let result = params[0].axisValue + "<br/>";

          // Sort by value descending
          const sortedParams = [...params].sort((a, b) => b.value - a.value);

          sortedParams.forEach((param) => {
            const candidate = param.seriesName;
            const role = roles[candidate];
            const value = param.value;

            // Add role to tooltip
            result += `${param.marker} ${candidate} (${role}): ${value}<br/>`;
          });

          return result;
        },
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        data: candidates,
        bottom: 0,
        formatter: function (name) {
          const role = roles[name];
          const fmt_name = formatAccountLabel(name);
          return role === "Member"
            ? `${fmt_name}`
            : role === "RunnerUp"
              ? `${fmt_name}`
              : fmt_name;
        },
        selected: candidates.reduce((acc, candidate) => {
          // Only display Members and RunnersUp by default
          acc[candidate] = roles[candidate] !== "NotElected";
          return acc;
        }, {}),
      },
      grid: {
        show: true,
        top: "10%",
        bottom: "8%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: progressionData.map((round) => round.round),
      },
      yAxis: {
        type: "value",
        name: "Score",
        scale: true,
      },
      series: series,
    };
  }

  function setActiveTab(tab: string) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Liberland Election Explorer</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Liberland Election Explorer</h1>
    <p class="subtitle">
      Council Election at Block: <span class="block-hash"
        >{electionData.blockHash}</span
      >
    </p>
  </div>

  <div class="tab-container">
    <div class="tabs">
      <button
        class="tab-button {activeTab === 'results' ? 'active' : ''}"
        onclick={() => setActiveTab("results")}
      >
        Election Results
      </button>
      <button
        class="tab-button {activeTab === 'comparison' ? 'active' : ''}"
        onclick={() => setActiveTab("comparison")}
      >
        Stake Comparison
      </button>
      <button
        class="tab-button {activeTab === 'scatter' ? 'active' : ''}"
        onclick={() => setActiveTab("scatter")}
      >
        Score vs Stake
      </button>
      <button
        class="tab-button {activeTab === 'progression' ? 'active' : ''}"
        onclick={() => setActiveTab("progression")}
      >
        Rounds Progression
      </button>
    </div>
  </div>

  <div class="chart-container">
    {#if activeTab === "results"}
      <div class="chart-description">
        <h2>Final Election Results</h2>
        <p>
          This chart shows the final scores that determined the election
          outcome. The higher the score, the better the candidate performed in
          the elections. The top 7 candidates become Council Members, the next 7
          become Runners Up.
        </p>
      </div>
      <div class="chart" use:echartAction={getElectionResultsOptions()}></div>
    {:else if activeTab === "comparison"}
      <div class="chart-description">
        <h2>Initial Stake vs. Final Applied Stake</h2>
        <p>
          Compare each candidate's initial stake (lighter bars) with their final
          applied stake (darker bars). Notice how the algorithm redistributes
          stake for proportional representation, which is why candidates with
          high initial stake may not always be elected.
        </p>
      </div>
      <div class="chart" use:echartAction={getStakeComparisonOptions()}></div>
    {:else if activeTab === "scatter"}
      <div class="chart-description">
        <h2>Score vs Initial Stake</h2>
        <p>
          This scatter plot visualizes the relationship between initial stake
          and final election score. The lack of a strong positive correlation
          demonstrates why high initial stake doesn't guarantee election.
        </p>
      </div>
      <div class="chart" use:echartAction={getScatterPlotOptions()}></div>
    {:else if activeTab === "progression"}
      <div class="chart-description">
        <h2>Score Progression Across Rounds</h2>
        <p>
          This chart shows how candidate scores evolved during the election
          process. As the algorithm distributes votes, some candidates maintain
          their positions while others rise or fall.
        </p>
      </div>
      <div class="chart" use:echartAction={getRoundProgressionOptions()}></div>
    {/if}
  </div>

  <div class="explanation">
    <h2>How the Algorithm Works</h2>
    <p>
      The algorithm selects candidates in a way that promotes proportional
      representation, not just based on total stake. This ensures a balanced
      Council that represents the entire community, not just those with the
      highest backing.
    </p>
    <div class="key-concepts">
      <h3>Key Concepts:</h3>
      <ul>
        <li>
          <strong>Score:</strong> Determines election order. Higher score = better
          chance of being elected.
        </li>
        <li>
          <strong>Load Balancing:</strong> Distributes stake to promote fair representation
          across all voters.
        </li>
      </ul>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .header h1 {
    margin-bottom: 10px;
    color: #1e40af;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #6b7280;
  }

  .block-hash {
    font-family: monospace;
    background-color: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .tab-container {
    margin-bottom: 20px;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 10px;
  }

  .tab-button {
    padding: 10px 20px;
    background-color: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
  }

  .tab-button:hover {
    background-color: #f1f5f9;
  }

  .tab-button.active {
    background-color: #2563eb;
    color: white;
    border-color: #2563eb;
  }

  .chart-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    overflow: hidden;
    padding: 20px;
  }

  .chart-description {
    margin-bottom: 20px;
  }

  .chart-description h2 {
    font-size: 1.25rem;
    color: #1e40af;
    margin-bottom: 10px;
  }

  .chart-description p {
    color: #64748b;
    max-width: 800px;
  }

  .chart {
    margin-top: 50px;
    margin-bottom: 50px;
    width: 100%;
    height: 700px;
  }

  .explanation {
    background-color: #eff6ff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }

  .explanation h2 {
    font-size: 1.25rem;
    color: #1e40af;
    margin-bottom: 10px;
  }

  .explanation p {
    color: #64748b;
    margin-bottom: 15px;
  }

  .key-concepts h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    color: #1e40af;
  }

  .key-concepts ul {
    padding-left: 20px;
  }

  .key-concepts li {
    margin-bottom: 8px;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .chart {
      height: 400px;
    }

    .tabs {
      justify-content: center;
    }
  }
</style>
