<script lang="ts">
    import { goto } from "$app/navigation";
    import { invalidateAll } from "$app/navigation";
    import type { User } from "./$types";
    
    let { isLoggedIn, user } = $props<{
        isLoggedIn: boolean;
        user: User | undefined;
    }>();

    const logout = async () => {
        const formData = new FormData();
        const response = await fetch('/logout', { 
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (response.ok) {
            await invalidateAll();
            user = undefined;
            isLoggedIn = false;
            goto("/");
        }
    }
</script>

<div class="nav-bar">
    <div class="nav-left">
        <a href="/"><img src="/logo.png" alt="Golf Game Logo" class="logo" /></a>
        <div class="dropdown">
            <button class="dropdown-btn">Menu</button>
            <div class="dropdown-content">
                <a href="/holes">Holes</a>
                <a href="/courses">Courses</a>
                <a href="/profile">Profile</a>
            </div>
        </div>
        <a href="/"><h1>Pixel Golf</h1></a>
    </div>
    <div class="nav-right">
        {#if !isLoggedIn}
            <a href="/login" class="auth-button">Login</a>
            <a href="/signup" class="auth-button primary">Sign Up</a>
        {:else}
            <button type="submit" class="auth-button" onclick={logout}>Logout {user?.name}</button>
        {/if}
    </div>
</div>

<style>
    .nav-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background-color: #272727;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 2rem;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .nav-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .nav-left img {
        height: 40px;
        width: auto;
        border-radius: 30%;
    }

    .logo {
        height: 40px;
        width: auto;
    }

    h1 {
        color: #ffffff;
        font-size: 1.5rem;
        margin: 0;
    }

    .nav-right {
        display: flex;
        gap: 1rem;
    }

    .auth-button {
        padding: 0.5rem 1rem;
        border: 1px solid #ffffff;
        border-radius: 4px;
        background: transparent;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
    }

    .auth-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .auth-button.primary {
        background: #ffffff;
        color: #272727;
    }

    .auth-button.primary:hover {
        background: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 768px) {
        .nav-bar {
            padding: 0 1rem;
        }
    }

    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-btn {
        padding: 0.5rem 1rem;
        background: transparent;
        color: #ffffff;
        border: 1px solid #ffffff;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .dropdown-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .dropdown-content {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #272727;
        min-width: 160px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        z-index: 1001;
    }

    .dropdown:hover .dropdown-content {
        display: block;
    }

    .dropdown-content a {
        color: #ffffff;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        transition: background-color 0.2s;
    }

    .dropdown-content a:hover {
        background-color: #383838;
    }
</style> 