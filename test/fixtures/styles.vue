<template>
  <div :class="['scoped', $style.module, custom.custom]" />
</template>


<style scoped>
.scoped {
  color: black;
}
</style>

<style module>
.module {
  color: red;
}
</style>

<style module="custom">
.custom {
  color: blue;
}
</style>

