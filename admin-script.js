/* ==========================================
   LOGICA EXCLUSIVA DEL PANEL ADMIN - SUPABASE
   ========================================== */

const apiRequest = async (url, options = {}) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.error || 'Error de servidor.');
    }

    return payload;
};

document.addEventListener('DOMContentLoaded', () => {
    const BASE_INVITACION_URL = 'https://invitaciones-boda-yuri.vercel.app/';
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123';
    const ADMIN_SESSION_KEY = 'admin_access_granted';
    const tbody = document.getElementById('admin-tbody');
    const adminLock = document.getElementById('admin-lock');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminUsernameInput = document.getElementById('admin-username-input');
    const adminPasswordInput = document.getElementById('admin-password-input');
    const adminLoginError = document.getElementById('admin-login-error');
    const adminContainer = document.querySelector('.admin-container');

    const mostrarPanel = () => {
        adminLock.style.display = 'none';
        adminContainer.classList.remove('admin-panel-hidden');
        cargarDatosAdministracion();
    };

    const bloquearPanel = () => {
        adminLock.style.display = 'flex';
        adminContainer.classList.add('admin-panel-hidden');
    };

    // Proteccion basica del panel (cliente): clave por pestana.
    // Si queres cambiarla, modifica ADMIN_PASSWORD.
    if (new URLSearchParams(window.location.search).get('logout') === '1') {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }

    const yaAutorizado = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    if (yaAutorizado) {
        mostrarPanel();
    } else {
        bloquearPanel();
    }

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameIngresado = adminUsernameInput.value.trim().toLowerCase();
        const passwordIngresada = adminPasswordInput.value;

        if (usernameIngresado !== ADMIN_USERNAME || passwordIngresada !== ADMIN_PASSWORD) {
            adminLoginError.innerText = 'Usuario o clave incorrectos. Intentalo nuevamente.';
            adminPasswordInput.value = '';
            adminUsernameInput.focus();
            return;
        }

        adminLoginError.innerText = '';
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        mostrarPanel();
    });

    // Función encargada de traer los registros de la nube, renderizar y calcular métricas
    async function cargarDatosAdministracion() {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color:var(--muted);">Cargando confirmaciones desde Supabase...</td></tr>`;
        
        try {
            // Traemos todos los registros de la tabla ordenados por ID de manera descendente
            const { data: asistencias } = await apiRequest('/api/asistencias');

            tbody.innerHTML = '';

            let totalRespuestas = asistencias.length;
            let totalConfirmados = 0;
            let totalNoAsisten = 0;
            let totalVehiculos = 0;

            if (totalRespuestas === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color:var(--muted);">No hay confirmaciones registradas aún.</td></tr>`;
            }

            asistencias.forEach((item) => {
                if (item.asistencia === 'si') {
                    totalConfirmados++;
                } else {
                    totalNoAsisten++;
                }
                if (item.vehiculo_tipo) {
                    totalVehiculos++;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.nombre}</strong></td>
                    <td><span class="badge-status ${item.asistencia === 'si' ? 'badge-si' : 'badge-no'}">${item.asistencia.toUpperCase()}</span></td>
                    <td>${item.menu || '-'}</td>
                    <td style="color: ${item.alergia && item.alergia !== '-' ? 'var(--error)' : 'inherit'}; font-weight: ${item.alergia && item.alergia !== '-' ? '600' : 'normal'}">${item.alergia || '-'}</td>
                    <td>${item.vehiculo_tipo ? `${item.vehiculo_tipo} ${item.vehiculo_modelo}` : '-'}</td>
                    <td><code>${item.vehiculo_patente || '-'}</code></td>
                    <td><em>${item.playlist || '-'}</em></td>
                    <td><button class="btn-row-eliminar" data-id="${item.id}">Eliminar</button></td>
                `;
                tbody.appendChild(tr);
            });

            // Actualizar los paneles numéricos del dashboard
            document.getElementById('metric-respuestas').innerText = totalRespuestas;
            document.getElementById('metric-si').innerText = totalConfirmados;
            document.getElementById('metric-no').innerText = totalNoAsisten;
            document.getElementById('metric-autos').innerText = totalVehiculos;

            // Vincular eventos de borrado usando IDs únicos de la base de datos
            asignarEventosEliminar();

        } catch (err) {
            console.error("Error al leer desde Supabase:", err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color:var(--error);">Error al sincronizar con la base de datos.</td></tr>`;
        }
    }

    // --- GENERADOR DE LINKS PERSONALIZADOS ---
    const btnGenerar = document.getElementById('btn-generar');
    const btnCopiar = document.getElementById('btn-copiar');
    const genNombre = document.getElementById('gen-nombre');
    const genPases = document.getElementById('gen-pases');
    const containerResultado = document.getElementById('resultado-link-container');
    const inputUrlGenerada = document.getElementById('input-url-generada');

    if (btnGenerar) {
        btnGenerar.addEventListener('click', () => {
            const nombreVal = genNombre.value.trim();
            const pasesVal = genPases.value;

            if (!nombreVal) {
                alert('Por favor, ingresá el nombre del invitado o familia.');
                return;
            }

            const nombreFormateado = nombreVal.replace(/\s+/g, '_');
            const urlBase = new URL(BASE_INVITACION_URL);
            urlBase.searchParams.set('invitado', nombreFormateado);
            urlBase.searchParams.set('pases', pasesVal);
            const urlFinal = urlBase.toString();

            inputUrlGenerada.value = urlFinal;
            containerResultado.style.display = 'block';
            btnCopiar.innerText = 'Copiar';
        });
    }

    if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
            inputUrlGenerada.select();
            inputUrlGenerada.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(inputUrlGenerada.value)
                .then(() => {
                    btnCopiar.innerText = '¡Copiado! ✓';
                    setTimeout(() => { btnCopiar.innerText = 'Copiar'; }, 2000);
                })
                .catch(err => {
                    alert('No se pudo copiar automáticamente, por favor copialo manualmente.');
                });
        });
    }

    function asignarEventosEliminar() {
        document.querySelectorAll('.btn-row-eliminar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const rowId = e.target.getAttribute('data-id');
                
                if (confirm(`¿Estás seguro de que querés eliminar este registro de la base de datos?`)) {
                    try {
                        await apiRequest(`/api/asistencias?id=${encodeURIComponent(rowId)}`, {
                            method: 'DELETE'
                        });
                        cargarDatosAdministracion();
                    } catch (_) {
                        alert("Error al intentar eliminar de la base de datos.");
                    }
                }
            });
        });
    }

    // Evento para purgar por completo la tabla remota
    document.getElementById('btn-limpiar').addEventListener('click', async () => {
        if (confirm('🚨 ¡ATENCIÓN! Esto eliminará permanentemente TODAS las confirmaciones guardadas en Supabase. ¿Querés continuar?')) {
            // Un delete sin condiciones restrictivas (o apuntando a IDs mayores a 0) vacía la tabla
            try {
                await apiRequest('/api/asistencias?all=1', {
                    method: 'DELETE'
                });
                cargarDatosAdministracion();
            } catch (_) {
                alert("No se pudieron limpiar todos los datos de forma remota.");
            }
        }
    });

    // --- EXPORTAR A EXCEL (CSV desde Supabase) ---
    document.getElementById('btn-exportar').addEventListener('click', async () => {
        let asistencias = [];
        try {
            const response = await apiRequest('/api/asistencias');
            asistencias = response.data || [];
        } catch (_) {
            alert('No se pudo consultar la base de datos para exportar.');
            return;
        }

        if (!asistencias || asistencias.length === 0) {
            alert('No hay ninguna confirmación registrada para exportar.');
            return;
        }

        let contenidoCSV = "\uFEFF";
        contenidoCSV += "Invitado/Familia;Asistencia;Menú Seleccionado;Alergias Declaradas;Vehículo;Patente/Dominio;Canción Sugerida\n";

        asistencias.forEach(item => {
            const vehiculoInfo = item.vehiculo_tipo ? `${item.vehiculo_tipo} ${item.vehiculo_modelo}` : '-';
            contenidoCSV += `"${item.nombre}";"${item.asistencia.toUpperCase()}";"${item.menu || '-'}";"${item.alergia || '-'}";"${vehiculoInfo}";"${item.vehiculo_patente || '-'}";"${item.playlist || '-'}"\n`;
        });

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "lista_boda_supabase.csv");
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    if (!yaAutorizado) {
        adminUsernameInput.focus();
    }
});