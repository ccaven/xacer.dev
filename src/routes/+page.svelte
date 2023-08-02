<script lang="ts">

    let items = [
        "This is item 1",
        "This is item 2",
        "This is item 3",
        "This is item 4"
    ];

</script>

<div class="max-w-3xl w-full  mx-auto"> 

    <div class="w-full border-2 m-6">

        <h1 class="font-light text-center p-11 text-5xl">Hello</h1>

    </div>

    <div class="w-full p-2 border-2 m-6">

        {#each items as item}

            <div class="border-2 m-6">
                <p class="p-6">
                    {item}
                </p>
            </div>

        {/each}

    </div>

</div>