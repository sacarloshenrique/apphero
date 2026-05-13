const modal = document.getElementById('loginModal');
function abrirModal() { modal.style.display = 'flex'; }
function fecharModal() { modal.style.display = 'none'; }
window.onclick = function (event) { if (event.target == modal) { fecharModal(); } }
function redirecionarProApp() { window.location.href = "https://rotina.apphero.com.br"; }