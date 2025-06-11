<script lang="ts">
  import type { PageProps } from "./$types";
  import Council from "$lib/components/Council.svelte";

  const { data }: PageProps = $props();
</script>

<main>
  <Council electionData={data.electionData} />
</main>
