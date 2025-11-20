<script lang="ts">
    export let data
</script>

<h1>Jewelry in stock</h1>





{#if data.jewelry.length === 0}
    <p>No items in inventory yet</p>
{:else}
    <ul>
    {#each data.jewelry as item}
        <li>
        <strong>{item.name}</strong> - {item.type}
        <br>Material: {item.material}
        {#if item.gemstone}| Gemstone: {item.gemstone}{/if}
        <br>Price: ${item.price} | Quantity: {item.quantity}
        </li>
     {/each}
  </ul>
{/if}


<button>+</button>