<script lang="ts">

    import Card from "../components/card.svelte";

</script>

<div class="grid-container">
    {#each Array(39).fill(0).map((_, i) => i) as id}
        <Card id={id}/>
    {/each}
</div>

<style>

    :global(body) {
        padding-top: 0;
        margin: 0;
    }

    .grid-container {
        display: grid;
        /*grid-template-rows: repeat(3, 1fr);*/
        grid-template-columns: repeat(3, 1fr);
        gap: 1em;
        padding: 2em;
        max-width: 1080px;
        margin: auto;
    }

    .grid-container > div {
        border: 1px solid black;
        padding: 1rem;
        display: flex;
        justify-content: center;
        /*height: 100px;*/
        aspect-ratio: 1 / 1;
        border-radius: 1em;
    }

    .grid-container > div > p {
        place-self: center;
    }

</style>