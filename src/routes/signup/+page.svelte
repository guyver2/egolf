<script lang="ts">
    import type { ActionData } from './$types';
    
    export let form: ActionData;
    
    let username = '';
    let email = '';
    let password = '';
    let confirmPassword = '';
</script>

<div class="game-container">
    <div class="content-wrapper">
        <div class="form-container">
            <h1>Sign Up</h1>
            {#if form?.missing}
                <p class="error">Please fill in all fields</p>
            {/if}
            {#if form?.incorrect}
                <p class="error">Invalid email format</p>
            {/if}
            <form method="POST">
                <div class="form-group">
                    <label for="name">Username</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name"
                        required
                    />
                </div>
                <div class="form-group">
                    <label for="userEmail">Email</label>
                    <input 
                        type="email" 
                        id="userEmail" 
                        name="userEmail"
                        required
                    />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
                        required
                    />
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        bind:value={confirmPassword}
                        required
                    />
                </div>
                <button type="submit">Sign Up</button>
            </form>
        </div>
    </div>
</div>

<style>
    .game-container {
        min-height: 100vh;
        background-color: #1a1a1a;
        padding: 2rem 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .content-wrapper {
        max-width: 400px;
        width: 100%;
    }

    .form-container {
        background-color: #272727;
        padding: 2rem;
        border-radius: 8px;
        width: 100%;
    }

    h1 {
        color: #ffffff;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #444;
        border-radius: 4px;
        background-color: #333;
        color: #ffffff;
    }

    input:focus {
        outline: none;
        border-color: #666;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background-color: #4a4a4a;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        margin-top: 1rem;
    }

    button:hover {
        background-color: #5a5a5a;
    }

    @media (max-width: 768px) {
        .game-container {
            padding: 1rem;
        }

        .form-container {
            padding: 1.5rem;
        }
    }

    .error {
        color: #ff5757;
        margin-bottom: 1rem;
        text-align: center;
    }
</style>
