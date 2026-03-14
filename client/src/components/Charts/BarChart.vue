<template>
  <div ref="chartRef" :style="{ height: height || '300px', width: '100%' }"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'BarChart',
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
    barColor: {
      type: String,
      default: '#67C23A'
    },
    showLabel: {
      type: Boolean,
      default: false
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
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.categories,
          name: this.xAxisName,
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            rotate: this.categories.length > 6 ? 45 : 0
          }
        },
        yAxis: {
          type: 'value',
          name: this.yAxisName,
          nameLocation: 'middle',
          nameGap: 40
        },
        series: [
          {
            type: 'bar',
            data: this.data,
            itemStyle: {
              color: this.barColor
            },
            label: this.showLabel ? {
              show: true,
              position: 'top'
            } : {}
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