<template>
  <div class="wrapper">
    <a-spin :spinning="spinning">
      <a-button class="header-button" ghost type="danger" icon="control" @click="configFn">同步配置</a-button>
      <a-button-group>
        <a-button v-if="uniList.length > 0" icon="file-text" @click="updateDocument">更新到文档</a-button>
        <a-button v-if="uniList.length > 0" icon="folder" @click="updateApp">更新到hello uni-app</a-button>
      </a-button-group>

      <a-dropdown :loading="true" v-if="uniList.length > 0" style="margin-left: 20px">
        <a-menu slot="overlay" @click="updateUniUi">
          <a-menu-item :key="0">
            <a-icon type="layout" />生成uni-ui插件包
          </a-menu-item>
          <a-menu-item :key="1">
            <a-icon type="profile" />更新到插件市场
          </a-menu-item>
          <a-menu-item :key="2">
            <a-icon type="file-add" />更新到 npm
          </a-menu-item>
          <a-menu-item :key="3">
            <a-icon type="project" />插件市场 & npm
          </a-menu-item>
        </a-menu>
        <a-button style="margin-left: 8px">
          uni-ui整包操作
          <a-icon type="down" />
        </a-button>
      </a-dropdown>
    </a-spin>

    <!-- <a-button v-if="uniList.length > 0" icon="ios-search" @click="updateUniUi(true)">生成uni-ui插件包</a-button> -->

    <div v-if="uniList.length > 0" class="uni-ui__card">
      <a-card class="uni-ui__card-warp" v-for="(item,index) in uniList" :key="index">
        <div slot="title" class="uni-ui__card-box">
          <p class="uni-ui__card-box-content">
            <span class="content-href" @click="openWindows(item.path)">{{item.name}} {{item.desc}}</span>
            <a-tag class="box-badge" color="#f50">{{item.edition}}</a-tag>
          </p>
          <div>
            <a-button icon="profile"  @click="open(item)">更新到插件市场</a-button>
            <a-button
              icon="profile"
              type="primary"
              class="button-right"
              @click="generate(item)"
            >生成插件包</a-button>
          </div>
        </div>
        <div v-if="item.update_log" v-html="item.update_log"></div>
        <div v-else>无最新更新记录</div>
      </a-card>
    </div>
    <div v-else class="uni-ui__card-no-path">请配置 uni-ui 的正确路径</div>
    <a-modal
      :visible="modal"
      title="uni-ui 同步配置项"
      @ok="ok"
      @cancel="handleCancel"
      width="700px"
      cancelText="取消"
      okText="确认"
    >
      <div>
        <a-form :label-width="260">
          <a-form-item :label="item.name" v-for="(item,index) in formItem" :key="index">
            <a-row>
              <a-col span="20">
                <a-select
                  v-model="item.select"
                  not-found-text="请选择目录"
                  @change="selectChange($event,item,index)"
                >
                  <a-select-option
                    :value="history.value"
                    v-for="(history , idx) in item.history"
                    :key="idx"
                  >{{history.lable}}</a-select-option>
                </a-select>
              </a-col>
              <a-col span="2" offset="1">
                <a-button @click="openFilesFn(item,index)">选择目录</a-button>
              </a-col>
            </a-row>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { getFiles, syncUniApp, syncUniUi, completeUniUi } from '@/utils'
import { mapGetters } from 'vuex'
// const fs = require('fs')
export default {
  name: 'index',
  data () {
    return {
      uniList: [],
      modal: false,
      spinning: false,
      formItem: [
        {
          name: '本地 uni-ui 地址',
          select: '',
          history: []
        },
        {
          name: '本地 hello-uniapp 地址',
          select: '',
          history: []
        },
        {
          name: '本地文档地址',
          select: '',
          history: []
        },
        {
          name: '生成本地插件包保存地址',
          select: '',
          history: []
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['historyList'])
  },
  created () {
    if (this.historyList.length > 0) {
      this.formItem = Object.assign(
        this.formItem,
        JSON.parse(JSON.stringify(this.historyList))
      )
    }
    const uniUi = this.formItem[0]
    this.uniList = getFiles(uniUi.history[uniUi.select].lable)
  },
  methods: {
    configFn () {
      this.modal = true
    },
    ok () {
      console.log('确定')
      const uniUi = this.historyList[0]
      this.uniList = getFiles(uniUi.history[uniUi.select].lable)
      this.modal = false
    },
    handleCancel () {
      this.modal = false
    },
    selectChange (e, item, index) {
      console.log(e, item, index)
      this.formItem[index].select = e
      this.$set(this.formItem, index, item)
      this.$store.dispatch(
        'app/setHistory',
        Object.assign(JSON.parse(JSON.stringify(this.formItem)))
      )
    },
    openFilesFn (item, index) {
      const dialog = this.$electron.remote.dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      item.history.push({
        value: item.history.length,
        lable: dialog[0]
      })
      this.formItem[index].select = item.history.length - 1
      this.$set(this.formItem, index, item)
      this.$store.dispatch(
        'app/setHistory',
        Object.assign(JSON.parse(JSON.stringify(this.formItem)))
      )
    },
    updateApp () {
      if (this.disabledTap) return
      const uniUi = this.historyList[0]
      const uniApp = this.historyList[1]
      if (!uniApp.history[uniApp.select].lable) {
        this.$Notice.error({
          title: '请配置 hello uni-app 地址'
        })
        return
      }
      console.log(uniApp.history[uniApp.select].lable)
      this.spinning = true
      syncUniApp(
        uniUi.history[uniUi.select].lable,
        uniApp.history[uniApp.select].lable,
        this
      )
        .then(() => {
          console.log('成功的回调')
          this.spinning = false
        })
        .catch(err => {
          console.log('取消了回调', err)
          this.spinning = false
        })
    },
    updateDocument () {
      console.log('----')
    },
    open (item) {
      const uniUi = this.historyList[0]
      if (!uniUi.history[uniUi.select].lable) {
        this.$Notice.error({
          title: '请配置本地 uni-ui 地址'
        })
        return
      }
      syncUniUi(uniUi.history[uniUi.select].lable, '', item, this)
    },
    generate (item) {
      const obj = {
        generate: true
      }
      const uniUi = this.historyList[0]
      const extLocal = this.historyList[3]
      console.log(extLocal.history[extLocal.select].lable)
      if (!extLocal.history[extLocal.select].lable) {
        this.$Notice.error({
          title: '请配置本地插件包地址'
        })
        return
      }
      syncUniUi(
        uniUi.history[uniUi.select].lable,
        extLocal.history[extLocal.select].lable,
        Object.assign({}, item, obj),
        this
      )
    },
    updateUniUi (event) {
      console.log(event)
      const uniUi = this.historyList[0]
      const extLocal = this.historyList[3]
      if (!extLocal.history[extLocal.select].lable) {
        this.$Notice.error({
          title: '请配置本地插件包地址'
        })
      }
      this.spinning = true
      // console.log(generate, event)
      completeUniUi(
        uniUi.history[uniUi.select].lable,
        extLocal.history[extLocal.select].lable,
        event
      ).then(() => {
        this.spinning = false
      })
    },
    openWindows (href) {
      this.$electron.shell.openExternal(href)
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  // height: 1000px;
  // border: 1px red solid;
  .header-button {
    margin-right: 10px;
  }
}
.uni-ui {
  &__card {
    &-warp {
      margin-top: 10px;
    }
    &-no-path {
      text-align: center;
      padding: 20px;
    }
    &-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      // padding: 5px 20px;
      &-content {
        display: flex;
        align-items: center;
        margin-bottom: 0;
        .content-href {
          color: #77cbea;
          cursor: pointer;
          &:hover {
            color: #00b7fd;
          }
        }
        .box-badge {
          font-size: 14px;
          margin-left: 10px;
        }
      }
      .button-right {
        margin-left: 10px;
      }
    }
  }
}
</style>

