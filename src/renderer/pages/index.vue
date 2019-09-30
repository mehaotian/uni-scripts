<template>
  <div class="wrapper">
    <Button icon="ios-search" @click="configFn">同步配置</Button>
    <Button v-if="uniList.length > 0" icon="ios-search">更新到文档</Button>
    <Button v-if="uniList.length > 0" icon="ios-search" @click="updateApp">更新到hello uni-app</Button>
    <!-- <Button icon="ios-search">更新到插件市场</Button> -->
    <div v-if="uniList.length > 0" class="uni-ui__card">
      <Card class="uni-ui__card-warp" v-for="(item,index) in uniList" :key="index">
        <div slot="title" class="uni-ui__card-box">
          <p class="uni-ui__card-box-content">
            <span class="content-href" @click="openWindows(item.path)">{{item.name}} {{item.desc}}</span>
            <Badge :text="item.edition" class="box-badge"></Badge>
          </p>
          <Button @click="open(item)">更新到插件市场</Button>
          <Button class="button-right" @click="generate(item)">生成插件包</Button>
        </div>
        <div v-if="item.update_log" v-html="item.update_log"></div>
        <div v-else>无最新更新记录</div>
      </Card>
    </div>
    <div v-else class="uni-ui__card-no-path">
      请配置 uni-ui 的正确路径
    </div>
    <Modal v-model="modal" fullscreen title="uni-ui 同步配置项" @on-ok="ok">
      <div>
        <Form :label-width="150">
          <FormItem :label="item.name" v-for="(item,index) in formItem" :key="index">
            <Row>
              <Col span="20">
                <Select v-model="item.select" not-found-text="请选择目录" @on-change="selectChange($event,item,index)">
                  <Option
                    :value="history.value"
                    v-for="(history , idx) in item.history"
                    :key="idx"
                  >{{history.lable}}</Option>
                </Select>
              </Col>
              <Col span="2" offset="1">
                <Button @click="openFilesFn(item,index)">选择目录</Button>
              </Col>
            </Row>
          </FormItem>
        </Form>
      </div>
    </Modal>
  </div>
</template>

<script>
//
import {getFiles, syncUniApp, syncUniUi} from '@/utils'
import { mapGetters } from 'vuex'
// const fs = require('fs')
export default {
  name: 'index',
  data () {
    return {
      uniList: [],
      modal: false,
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
      this.formItem = Object.assign(this.formItem, JSON.parse(JSON.stringify(this.historyList)))
    }
    const uniUi = this.formItem[0]
    this.uniList = getFiles(uniUi.history[uniUi.select].lable)
    console.log(this.formItem)
  },
  methods: {
    configFn () {
      this.modal = true
    },
    ok () {
      console.log('确定')
      const uniUi = this.historyList[0]
      this.uniList = getFiles(uniUi.history[uniUi.select].lable)
    },
    selectChange (e, item, index) {
      console.log(e, item, index)
      this.formItem[index].select = e
      this.$set(this.formItem, index, item)
      this.$store.dispatch('app/setHistory', Object.assign(JSON.parse(JSON.stringify(this.formItem))))
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
      this.$store.dispatch('app/setHistory', Object.assign(JSON.parse(JSON.stringify(this.formItem))))
    },
    updateApp () {
      if (this.disabledTap) return
      const uniUi = this.historyList[0]
      const uniApp = this.historyList[1]
      syncUniApp(uniUi.history[uniUi.select].lable, uniApp.history[uniApp.select].lable, this)
    },
    open (item) {
      console.log('更新到插件市场')
      const uniUi = this.historyList[0]
      syncUniUi(uniUi.history[uniUi.select].lable, '', item, this)
    },
    generate (item) {
      const obj = {
        generate: true
      }
      const uniUi = this.historyList[0]
      const extLocal = this.historyList[3]

      syncUniUi(uniUi.history[uniUi.select].lable, extLocal.history[extLocal.select].lable, Object.assign({}, item, obj), this)
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

