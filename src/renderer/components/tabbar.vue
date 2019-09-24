<template>
  <div class="tabbar">
    <div class="tabbar-box">
      <Menu mode="horizontal" active-name="1">
        <MenuItem name="1" to="/">
            <Icon type="ios-paper" />
            uni-ui
        </MenuItem>
        <MenuItem name="2" to="/shuttering">
            <Icon type="ios-people" />
            模板
        </MenuItem>
    </Menu>
    </div>
    <div class="app-main-box">
      <app-main></app-main>
    </div>
  </div>
</template>

<script>
import appMain from './appMain.vue'
export default {
  name: 'Tabbar',
  components: {
    appMain
  },
  data () {
    return {}
  },
  methods: {},
  created () {},
  mounted () {},
  computed: {
    key () {
      return this.$route.path
    }
  }
}
</script>
<style lang="scss" scoped>
.tabbar {
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  width: 100%;
  .tabbar-box {
    width: 100%;
  }
  .app-main-box {
    flex: 1;
    width: 100%;
    overflow-y: scroll;
    padding: 10px;
    box-sizing: border-box;
  }
}
</style>