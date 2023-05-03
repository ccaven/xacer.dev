<script lang="ts">

    /**
     *
     * CARD BEHAVIOR
     *
     * 1. By default, randomly changes between being dark gray and being "active"
     * 2. Becomes active on mouseover
     * 3. When active:
     *  - Clickable
     *  - Displays thumbnail image
     *  - Text animation for title
     *
     */

    export let id: number;

    // STEP 1. Load thumbnail from static/images/

</script>

<div>
    <p>
        {id}
    </p>
</div>

<style>
    div {
        border: 1px solid black;
        padding: 1rem;
        display: flex;
        justify-content: center;
        /*height: 100px;*/
        aspect-ratio: 1 / 1;
        border-radius: 1em;
        box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    }
    div > p {
        place-self: center;
    }
</style>