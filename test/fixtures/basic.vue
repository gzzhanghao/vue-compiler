<template>
  <div>
    Lorem {{ foo }}
  </div>
</template>

<script>
  module.exports = {

    data() {
      return {
        foo: 'bar',
      }
    },
  }
</script>

<style>
.foo {
  color: black;
}
</style>
