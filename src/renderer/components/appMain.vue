<template>
  <div class="app-mian">
    <router-view :key="key">qqqqq</router-view>
  </div>
</template>

<script>
export default {
  name: 'appMain',
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
.app-mian {
  width: 100%; 
}
</style>