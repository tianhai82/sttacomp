<script>
  let { cls = "", disabled = false, onclick, children } = $props();
</script>

<button
  class="focus:outline-none uppercase tracking-wide h-8 px-4 rounded shadow-sm hover:shadow-md active:shadow-none transition-shadow ripple disabled:opacity-25 disabled:cursor-not-allowed {cls}"
  {disabled}
  {onclick}
>
  {children}
</button>
