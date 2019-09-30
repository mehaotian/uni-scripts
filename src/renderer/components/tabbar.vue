<template>
  <div class="tabbar">
    <div class="tabbar-box">
      <Menu class="menu" mode="horizontal" active-name="1">
        <MenuItem name="1" to="/">
          <Icon type="ios-paper"/>uni-ui
        </MenuItem>
        <MenuItem name="2" to="/shuttering">
          <Icon type="ios-people"/>模板
        </MenuItem>
      </Menu>
      <div class="tabbar-button">
        <i-button type="info" @click="update">检查更新</i-button>
      </div>
    </div>
    <div class="app-main-box">
      <app-main></app-main>
    </div>
  </div>
</template>

<script>
import appMain from './appMain.vue'
import pkg from '../../../package.json'
const version = pkg.version
const release = 'https://api.github.com/repos/mehaotian/uni-scripts/releases/latest'
const downloadUrl = 'https://github.com/mehaotian/uni-scripts/releases/latest'
export default {
  name: 'Tabbar',
  components: {
    appMain
  },
  data () {
    return {}
  },
  methods: {
    async update () {
      const res = await this.$http.get(release)
      if (res.status === 200) {
        const latest = res.data.name // 获取版本号
        const result = this.compareVersion2Update(version, latest) // 比对版本号，如果本地版本低于远端则更新
        if (result) {
          this.$electron.remote.dialog.showMessageBox({
            type: 'info',
            title: '发现新版本',
            buttons: ['Yes', 'No'],
            message: '发现新版本，更新了更多功能，是否去下载最新的版本？',
            checkboxLabel: '以后不再提醒',
            checkboxChecked: false
          }, (res, checkboxChecked) => {
            if (res === 0) { // if selected yes
              this.$electron.shell.openExternal(downloadUrl)
            }
          })
        } else {
          this.$electron.remote.dialog.showMessageBox({
            type: 'info',
            title: '提示',
            buttons: ['确认'],
            message: '已经是最新版本，不需要更新'
          })
        }
      }
    },
    compareVersion2Update (current, latest) {
      const currentVersion = current.split('.').map(item => parseInt(item))
      const latestVersion = latest.split('.').map(item => parseInt(item))
      let flag = false

      for (let i = 0; i < 3; i++) {
        if (currentVersion[i] < latestVersion[i]) {
          flag = true
        }
      }

      return flag
    }
  },
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
    position: relative;
    .tabbar-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 999;
    }
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