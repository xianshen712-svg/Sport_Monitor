<template>
  <div ref="chartRef" :style="{ height: height || '300px', width: '100%' }"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'LineChart',
  props: {
    height: {
      type: String,
      default: '300px'
    },
    data: {
      type: Array,
      default: () => []
    },
    categories: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    },
    xAxisName: {
      type: String,
      default: ''
    },
    yAxisName: {
      type: String,
      default: ''
    },
    lineColor: {
      type: String,
      default: '#409EFF'
    },
    showArea: {
      type: Boolean,
      default: false
    },
    smooth: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      chartInstance: null
    };
  },
  mounted() {
    this.initChart();
    window.addEventListener('resize', this.resizeChart);
  },
  beforeDestroy() {
    this.destroyChart();
    window.removeEventListener('resize', this.resizeChart);
  },
  watch: {
    data: {
      handler() {
        this.updateChart();
      },
      deep: true
    },
    categories: {
      handler() {
        this.updateChart();
      },
      deep: true
    }
  },
  methods: {
    initChart() {
      this.chartInstance = echarts.init(this.$refs.chartRef);
      this.updateChart();
    },
    updateChart() {
      if (!this.chartInstance) return;
      
      const option = {
        title: {
          text: this.title,
          show: !!this.title
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.categories,
          name: this.xAxisName,
          nameLocation: 'middle',
          nameGap: 30
        },
        yAxis: {
          type: 'value',
          name: this.yAxisName,
          nameLocation: 'middle',
          nameGap: 40
        },
        series: [
          {
            type: 'line',
            data: this.data,
            smooth: this.smooth,
            lineStyle: {
              color: this.lineColor
            },
            itemStyle: {
              color: this.lineColor
            },
            areaStyle: this.showArea ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: this.lineColor + '80'
                }, {
                  offset: 1, color: this.lineColor + '20'
                }]
              }
            } : null
          }
        ]
      };
      
      this.chartInstance.setOption(option, true);
    },
    resizeChart() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    },
    getChartInstance() {
      return this.chartInstance;
    }
  }
};
</script>