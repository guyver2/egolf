<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="error-container">
    <h1>{$page.status}: {$page.error?.message}</h1>
    <a href="/">Return Home</a>
</div>

<style>
    .error-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #1a1a1a;
        color: white;
        text-align: center;
        padding: 2rem;
    }

    a {
        color: #3a3;
        text-decoration: none;
        margin-top: 1rem;
    }

    a:hover {
        text-decoration: underline;
    }
</style> 