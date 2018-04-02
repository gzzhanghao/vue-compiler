<template>
  <div>
    <span>Lorem {{foo}}</span>
  </div>
</template>

<script>
  module.exports = {

    data() {
      return {
        foo: 'ipsum',
      }
    },
  }
</script>

<style>
.foo {
  color: black;
}
</style>
