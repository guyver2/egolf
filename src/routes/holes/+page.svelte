<script>
    /** @type {import('./$types').PageData} */
    export let data;
</script>

<h1>Holes</h1>

{#if data.holes && data.holes.length > 0}
    <div class="holes-grid">
        {#each data.holes as hole}
            <div class="hole-card">
                <div class="hole-info">
                    <h2>{hole.name}</h2>
                    <p>Seed: {hole.seed}</p>
                    <p>Size: {hole.width}x{hole.height}</p>
                    {#if hole.authorId}
                        <p>Author: {hole.author?.name}</p>
                    {:else}
                        <p>Author: System</p>
                    {/if}
                    <p>Created: {new Date(hole.createdAt).toDateString()}</p>
                </div>
                <div class="hole-actions">
                    <a class="button" href={`/play/hole/${hole.id}`}>Play</a>
                    <a class="button" href={`/courses?holeId=${hole.id}`}>Associated Courses</a>
                </div>
            </div>
        {/each}
    </div>
{:else}
    <p>No holes found.</p>
{/if}

<style>
    .holes-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .hole-card {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 1rem;
        background-color: #272727;;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        color: white;
        justify-content: space-between;
    }

    .hole-info {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
    }

    .hole-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        justify-content: flex-end;
        align-items: flex-end;
    }

    .button {
        background-color: #444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
    }

    h1 {
        margin: 1rem;
    }
</style>
