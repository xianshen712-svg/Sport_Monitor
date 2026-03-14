<template>
  <div ref="chartRef" :style="{ height: height || '300px', width: '100%' }"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PieChart',
  props: {
    height: {
      type: String,
      default: '300px'
    },
    data: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    legendPosition: {
      type: String,
      default: 'bottom'
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    labelFormat: {
      type: String,
      default: '{b}: {c} ({d}%)'
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
          trigger: 'item',
          formatter: this.labelFormat
        },
        legend: this.showLegend ? {
          orient: 'horizontal',
          bottom: this.legendPosition === 'bottom' ? 10 : 'auto',
          top: this.legendPosition === 'top' ? 40 : 'auto',
          left: this.legendPosition === 'left' ? 10 : 'center',
          right: this.legendPosition === 'right' ? 10 : 'auto',
          data: this.data.map(item => item.name)
        } : {
          show: false
        },
        series: [
          {
            name: this.title,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: this.showLabel ? {
              show: false,
              position: 'center'
            } : {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: this.showLabel
            },
            data: this.data
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