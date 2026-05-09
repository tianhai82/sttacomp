<script>
  export let cls = "";
  export let disabled = false;
</script>

<button
  class="focus:outline-none uppercase tracking-wide h-8 px-4 rounded shadow-sm hover:shadow-md active:shadow-none transition-shadow ripple disabled:opacity-25 disabled:cursor-not-allowed {cls}"
  {disabled}
  on:click
>
  <slot></slot>
</button>
