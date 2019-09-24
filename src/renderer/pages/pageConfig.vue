<template>
  <div class="wrapper">
    我的
  </div>
</template>
<script>
export default {
  name: 'shuttering',
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>

<style lang="scss" scoped> 
.wrapper {
  border: 1px red solid;
}
</style>

