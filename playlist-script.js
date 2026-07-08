const guardarPlaylist = async (payload) => {
    const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'No se pudo guardar la sugerencia.');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('playlist-form');
    const message = document.getElementById('playlist-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cancion = document.getElementById('cancion').value.trim();
        const cantante = document.getElementById('cantante').value.trim();
        const motivo = document.getElementById('motivo').value.trim();

        if (!cancion) {
            message.style.color = 'var(--error)';
            message.innerText = 'Ingresá al menos una canción.';
            return;
        }

        try {
            await guardarPlaylist({
                cancion,
                cantante,
                motivo
            });

            form.reset();
            message.style.color = 'var(--ok)';
            message.innerText = 'Gracias. Tu sugerencia fue guardada con éxito.';
        } catch (error) {
            message.style.color = 'var(--error)';
            message.innerText = error.message || 'No se pudo guardar la sugerencia.';
        }
    });
});
