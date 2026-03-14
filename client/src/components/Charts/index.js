// 统一导出所有图表组件
import LineChart from './LineChart.vue';
import BarChart from './BarChart.vue';
import PieChart from './PieChart.vue';

export {
  LineChart,
  BarChart,
  PieChart
};

export default {
  install(Vue) {
    Vue.component('LineChart', LineChart);
    Vue.component('BarChart', BarChart);
    Vue.component('PieChart', PieChart);
  }
};