<template>
	<view class="uni-padding-wrap uni-common-pb">
		<view class="uni-header-logo">
			<image src="/static/extuiIndex.png"></image>
		</view>
		<view class="uni-hello-text uni-common-pb">
			以下是uni-app扩展组件示例，更多组件见插件市场：<u-link :href="'https://ext.dcloud.net.cn/'" :text="'https://ext.dcloud.net.cn'" :inWhiteList="true"></u-link>
		</view>
		<view class="uni-card" v-for="(list,index) in lists" :key="index">
			<view class="uni-list">
				<view class="uni-list-cell uni-collapse">
					<view class="uni-list-cell-navigate uni-navigate-right" hover-class="uni-list-cell-hover" @click="goDetailPage(list.url)">
						{{list.name}}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>
<script>
	import uLink from '@/components/uLink.vue'
	export default {
	  components: {
	    uLink
	  },
	  data () {
	    return {
	      /* lists */
	    }
  },
	  onLoad () {
	    // #ifdef APP-PLUS
	    plus.nativeUI.showWaiting('加载中……')
	    // #endif
  },
	  onReady () {
	    // #ifdef APP-PLUS
	    plus.nativeUI.closeWaiting()
	    // #endif
  },
	  onShareAppMessage () {
	    return {
	      title: '欢迎体验uni-app',
	      path: '/pages/tabBar/extUI/extUI'
	    }
	  },
	  onNavigationBarButtonTap (e) {
	    uni.navigateTo({
	      url: '/pages/about/about'
	    })
  },
	  methods: {
	    goDetailPage (path) {
	      uni.navigateTo({
	        url: '/pages/extUI/' + path + '/' + path
	      })
	    }
	  }
	}
</script>

<style>
	page {
		height: auto;
		min-height: 100%;
	}

	.uni-card {
		box-shadow: none;
	}

	.uni-list:after {
		height: 0;
	}

	.uni-list:before {
		height: 0;
	}

	.uni-hello-text {
		word-break: break-all;
	}
</style>
