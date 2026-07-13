/* ==========================================
   SCRIPT COMPLETO - WEB DE BODAS
   ========================================== */

const insertarAsistencias = async (filas) => {
    const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filas)
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'No se pudo guardar la confirmacion.');
    }
};

const insertarPlaylist = async (payload) => {
    const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'No se pudo guardar la sugerencia de playlist.');
    }
};

const parsearCancionArtista = (entrada) => {
    const partes = entrada.split(/\s+-\s+/);
    const cancion = (partes.shift() || '').trim();
    const cantante = partes.join(' - ').trim();

    return {
        cancion,
        cantante: cantante || null
    };
};

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CUENTA REGRESIVA ---
    const weddingDate = new Date('September 6, 2026 19:00:00').getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = weddingDate - now;

        if (difference < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerHTML = "<h3 style='color:white;'>¡Hoy es el gran día! 🎉</h3>";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = days < 10 ? '0' + days : days;
        document.getElementById('hours').innerText = hours < 10 ? '0' + hours : hours;
        document.getElementById('minutes').innerText = minutes < 10 ? '0' + minutes : minutes;
        document.getElementById('seconds').innerText = seconds < 10 ? '0' + seconds : seconds;

    };
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);


    // --- 2. BIENVENIDA Y GENERACIÓN DINÁMICA DE BLOQUES (INVITADO + MENÚ + ALERGIAS) ---
    const urlParams = new URLSearchParams(window.location.search);
    const invitadoParam = urlParams.get('invitado');
    const pasesParam = parseInt(urlParams.get('pases')) || 0;
    const contenedorNombres = document.getElementById('contenedor-nombres-dinamicos');

    if (invitadoParam) {
        const nombreLimpio = invitadoParam.replace(/_/g, ' ').trim();
        document.getElementById('welcome-title').innerText = `¡Hola ${nombreLimpio}!`;
    }

    if (pasesParam > 0) {
        document.getElementById('pases-cantidad').innerText = pasesParam;
        contenedorNombres.innerHTML = '';

        for (let i = 0; i < pasesParam; i++) {
            const esPrimerInvitado = i === 0;
            const bloqueInvitado = document.createElement('div');
            bloqueInvitado.className = 'bloque-invitado-dinamico';
            bloqueInvitado.style.borderBottom = "1px dashed #eae1d4";
            bloqueInvitado.style.paddingBottom = "1rem";
            bloqueInvitado.style.marginBottom = "1rem";

            bloqueInvitado.innerHTML = `
                <div class="form-group">
                    <label for="invitado-${i}">Nombre completo del invitado ${i + 1}${esPrimerInvitado ? ' (obligatorio)' : ' (opcional)'}:</label>
                    <input type="text" id="invitado-${i}" class="input-invitado-confirmar" placeholder="Escribir nombre y apellido" ${esPrimerInvitado ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label for="menu-${i}">Preferencia alimenticia:</label>
                    <select id="menu-${i}" class="select-menu-confirmar">
                        <option value="Tradicional">Tradicional</option>
                        <option value="Celíaco">Celíaco</option>
                        <option value="Vegetariano">Vegetariano</option>
                        <option value="Vegano">Vegano</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="alergia-${i}">¿Tiene alguna alergia alimenticia importante?</label>
                    <input type="text" id="alergia-${i}" class="input-alergia-confirmar" placeholder="Ej: Maní, mariscos, lactosa (o dejar vacío)">
                </div>
            `;
            contenedorNombres.appendChild(bloqueInvitado);
        }
    } else {
        document.getElementById('pases-container').style.display = 'none';
        contenedorNombres.innerHTML = `
            <div class="form-group">
                <label for="invitado-0">Nombre y Apellido:</label>
                <input type="text" id="invitado-0" class="input-invitado-confirmar" placeholder="Tu nombre y apellido" required>
            </div>
            <div class="form-group">
                <label for="menu-0">Preferencia alimenticia:</label>
                <select id="menu-0" class="select-menu-confirmar">
                    <option value="Tradicional">Tradicional</option>
                    <option value="Celíaco">Celíaco</option>
                    <option value="Vegetariano">Vegetariano</option>
                    <option value="Vegano">Vegano</option>
                </select>
            </div>
            <div class="form-group">
                <label for="alergia-0">¿Tiene alguna alergia alimenticia?</label>
                <input type="text" id="alergia-0" class="input-alergia-confirmar" placeholder="Ej: Maní, mariscos, lactosa (o dejar vacío)">
            </div>
        `;
    }

    // --- 3. LÓGICA CAMPOS DE VEHÍCULO ---
    const asistenciaInputs = document.querySelectorAll('input[name="asistencia"]');
    const vieneVehiculoSi = document.getElementById('viene-vehiculo-si');
    const vieneVehiculoNo = document.getElementById('viene-vehiculo-no');
    const vehiculoCampos = document.getElementById('vehiculo-campos');
    const parkingSection = document.querySelector('.parking-section');
    const vehiculoTipo = document.getElementById('vehiculo-tipo');
    const vehiculoModelo = document.getElementById('vehiculo-modelo');
    const vehiculoPatente = document.getElementById('vehiculo-patente');

    const limpiarCamposVehiculo = () => {
        vehiculoTipo.value = '';
        vehiculoModelo.value = '';
        vehiculoPatente.value = '';
    };

    const setVehiculoRequired = (required) => {
        vehiculoTipo.required = required;
        vehiculoModelo.required = required;
        vehiculoPatente.required = required;
    };

    const actualizarVisibilidadVehiculo = () => {
        const asistencia = document.querySelector('input[name="asistencia"]:checked')?.value;

        if (asistencia === 'si') {
            parkingSection.style.display = 'block';
        } else {
            parkingSection.style.display = 'none';
            vieneVehiculoNo.checked = true;
            vehiculoCampos.classList.add('oculto');
            setVehiculoRequired(false);
            limpiarCamposVehiculo();
            return;
        }

        if (vieneVehiculoSi.checked) {
            vehiculoCampos.classList.remove('oculto');
            setVehiculoRequired(true);
        } else {
            vehiculoCampos.classList.add('oculto');
            setVehiculoRequired(false);
            limpiarCamposVehiculo();
        }
    };

    asistenciaInputs.forEach((input) => {
        input.addEventListener('change', actualizarVisibilidadVehiculo);
    });
    vieneVehiculoSi.addEventListener('change', actualizarVisibilidadVehiculo);
    vieneVehiculoNo.addEventListener('change', actualizarVisibilidadVehiculo);
    actualizarVisibilidadVehiculo();

    // --- 4. FORMULARIO RSVP (CONEXIÓN A SUPABASE + ENVÍO A WHATSAPP) ---
    const form = document.getElementById('rsvp-form');
    const messageDiv = document.getElementById('form-message');

    // 💬 CONFIGURACIÓN DE TU WHATSAPP
    const TELEFONO_ADMIN = "5491125523930";

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const asistencia = document.querySelector('input[name="asistencia"]:checked')?.value;
        const playlist = document.getElementById('playlist').value.trim();
        const vieneVehiculo = vieneVehiculoSi.checked;

        const vTipo = vehiculoTipo.value.trim();
        const vModelo = vehiculoModelo.value.trim();
        const vPatente = vehiculoPatente.value.trim();

        const inputsNombres = document.querySelectorAll('.input-invitado-confirmar');
        const selectsMenus = document.querySelectorAll('.select-menu-confirmar');
        const inputsAlergias = document.querySelectorAll('.input-alergia-confirmar');

        let filasAInsertar = [];
        let resumenInvitados = [];
        let detalleMsgWhatsapp = "";

        // Procesamos los datos estructurándolos para las columnas de la tabla SQL
        inputsNombres.forEach((input, index) => {
            const nombre = input.value.trim();

            if (nombre !== "") {
                const menu = selectsMenus[index] ? selectsMenus[index].value : 'Tradicional';
                const alergia = inputsAlergias[index] ? inputsAlergias[index].value.trim() : '';

                filasAInsertar.push({
                    nombre: nombre,
                    asistencia: asistencia,
                    menu: asistencia === 'si' ? menu : '-',
                    alergia: asistencia === 'si' ? alergia : '-',
                    vehiculo_tipo: (asistencia === 'si' && vieneVehiculo) ? vTipo : '',
                    vehiculo_modelo: (asistencia === 'si' && vieneVehiculo) ? vModelo : '',
                    vehiculo_patente: (asistencia === 'si' && vieneVehiculo) ? vPatente : '',
                    playlist: playlist
                });

                let infoInvitado = `${nombre} (${menu})`;
                if (alergia !== "") infoInvitado += ` [Alergia: ${alergia}]`;
                resumenInvitados.push(infoInvitado);

                detalleMsgWhatsapp += `• *${nombre}* \n`;
                if (asistencia === 'si') {
                    detalleMsgWhatsapp += `   Menu: ${menu}\n`;
                    if (alergia) detalleMsgWhatsapp += `   Alergias: ${alergia}\n`;
                }
            }
        });

        if (filasAInsertar.length === 0) return;

        try {
            // Guardamos en API backend para no exponer llaves en frontend
            await insertarAsistencias(filasAInsertar);

            if (playlist) {
                const canciones = playlist
                    .split(',')
                    .map((cancion) => cancion.trim())
                    .filter(Boolean);

                const invitadoReferencia = filasAInsertar[0]?.nombre || 'invitado';
                const motivoBase = `Sugerida en confirmacion RSVP por ${invitadoReferencia} (${asistencia === 'si' ? 'asiste' : 'no asiste'})`;

                await Promise.all(
                    canciones.map((entrada) => {
                        const { cancion, cantante } = parsearCancionArtista(entrada);
                        return insertarPlaylist({ cancion, cantante, motivo: motivoBase });
                    })
                );
            }

            // Construcción del mensaje para WhatsApp
            let textoWhatsapp = "";

            if (asistencia === 'si') {
                textoWhatsapp += `*¡Nueva Confirmación de Asistencia!*\n\n`;
                textoWhatsapp += `*Asisten:* Sí, ¡confirmadísimo!\n\n`;
                textoWhatsapp += `*Invitados:*\n${detalleMsgWhatsapp}\n`;

                if (vieneVehiculo && (vTipo || vModelo || vPatente)) {
                    textoWhatsapp += ` *Datos del Vehículo:* \n`;
                    textoWhatsapp += `   Modelo: ${vTipo} ${vModelo}\n`;
                    textoWhatsapp += `   Patente: ${vPatente}\n\n`;
                }

                if (playlist) {
                    textoWhatsapp += `*Sugerencias de playlist:* ${playlist}\n`;
                }

            } else {
                textoWhatsapp += `*Aviso de Ausencia*\n\n`;
                textoWhatsapp += `*Invitados que no pueden asistir:*\n${detalleMsgWhatsapp}\n`;

                if (playlist) {
                    textoWhatsapp += `*Sugerencias de playlist:* ${playlist}\n\n`;
                }

                textoWhatsapp += `¡Los vamos a extrañar!`;
            }

            // Lanzar WhatsApp de manera nativa
            const urlWhatsapp = `https://wa.me/${TELEFONO_ADMIN}?text=${encodeURIComponent(textoWhatsapp)}`;
            window.open(urlWhatsapp, '_blank');

            // Feedback visual exitoso
            if (asistencia === 'si') {
                messageDiv.innerText = `¡Excelente! Confirmamos en la lista a: ${resumenInvitados.join(', ')}. Redirigiendo a WhatsApp...`;
                messageDiv.style.color = '#4b8b3b';
            } else {
                messageDiv.innerText = `Gracias por avisarnos. Redirigiendo a WhatsApp para enviar tu mensaje...`;
                messageDiv.style.color = '#c94c4c';
            }

            messageDiv.style.display = 'block';
            form.reset();
            if (typeof actualizarVisibilidadVehiculo === "function") {
                actualizarVisibilidadVehiculo();
            }

        } catch (err) {
            console.error("Error al registrar en Supabase:", err);
            alert("No se pudieron guardar los datos en el servidor. Revisá tu conexión e intentalo de nuevo.");
        }
    });

    // --- 5. BOTÓN DE COPIAR ALIAS ---
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) {
        const aliasText = document.getElementById('alias-text').innerText;
        const toast = document.getElementById('copy-toast');

        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(aliasText).then(() => {
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 2000);
            }).catch(err => console.error('Error al copiar: ', err));
        });
    }

    // --- 6. CARRUSEL: SWIPE/DRAG EN TOUCH Y ESCRITORIO ---
    const historyCarousel = document.querySelector('.history-carousel');
    const historyTrack = historyCarousel?.querySelector('.history-track');
    if (historyCarousel && historyTrack) {
        const prevControl = historyCarousel.querySelector('.history-control.prev');
        const nextControl = historyCarousel.querySelector('.history-control.next');
        let isPointerDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        let rafId = null;
        let lastFrameTime = 0;
        let manualPauseUntil = 0;
        const autoplaySpeed = window.matchMedia('(max-width: 768px)').matches ? 24 : 34;

        const getLoopWidth = () => historyTrack.scrollWidth / 2;

        const normalizeLoopPosition = () => {
            const loopWidth = getLoopWidth();
            if (!loopWidth) {
                return;
            }

            if (historyCarousel.scrollLeft >= loopWidth) {
                historyCarousel.scrollLeft -= loopWidth;
            } else if (historyCarousel.scrollLeft < 0) {
                historyCarousel.scrollLeft += loopWidth;
            }
        };

        const autoScroll = (time) => {
            if (!lastFrameTime) {
                lastFrameTime = time;
            }

            const deltaSeconds = (time - lastFrameTime) / 1000;
            lastFrameTime = time;

            if (!isPointerDown && time >= manualPauseUntil) {
                historyCarousel.scrollLeft += autoplaySpeed * deltaSeconds;
                normalizeLoopPosition();
            }

            rafId = window.requestAnimationFrame(autoScroll);
        };

        rafId = window.requestAnimationFrame(autoScroll);

        const getStepSize = () => {
            const firstItem = historyTrack.querySelector('.history-item');
            if (!firstItem) {
                return historyCarousel.clientWidth * 0.8;
            }

            const trackStyles = window.getComputedStyle(historyTrack);
            const gap = parseFloat(trackStyles.gap || 0);
            return firstItem.getBoundingClientRect().width + gap;
        };

        const moveByStep = (direction) => {
            const step = getStepSize();
            manualPauseUntil = performance.now() + 900;
            historyCarousel.scrollLeft += step * direction;
            normalizeLoopPosition();
            lastFrameTime = 0;
        };

        historyCarousel.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }

            isPointerDown = true;
            startX = event.clientX;
            startScrollLeft = historyCarousel.scrollLeft;
            historyCarousel.classList.add('is-dragging');
            historyCarousel.setPointerCapture(event.pointerId);
            lastFrameTime = 0;
        });

        historyCarousel.addEventListener('pointermove', (event) => {
            if (!isPointerDown) {
                return;
            }

            const deltaX = event.clientX - startX;
            historyCarousel.scrollLeft = startScrollLeft - deltaX;
            normalizeLoopPosition();
            event.preventDefault();
        }, { passive: false });

        const stopDragging = (event) => {
            if (!isPointerDown) {
                return;
            }

            isPointerDown = false;
            historyCarousel.classList.remove('is-dragging');

            if (event.pointerId !== undefined && historyCarousel.hasPointerCapture(event.pointerId)) {
                historyCarousel.releasePointerCapture(event.pointerId);
            }

            lastFrameTime = 0;
        };

        historyCarousel.addEventListener('pointerup', stopDragging);
        historyCarousel.addEventListener('pointercancel', stopDragging);
        historyCarousel.addEventListener('lostpointercapture', stopDragging);

        if (prevControl) {
            prevControl.addEventListener('click', () => moveByStep(-1));
        }

        if (nextControl) {
            nextControl.addEventListener('click', () => moveByStep(1));
        }

        window.addEventListener('resize', normalizeLoopPosition);
        window.addEventListener('beforeunload', () => {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        });
    }

});