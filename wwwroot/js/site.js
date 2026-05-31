/* ═══════════════════════════════════════════════════════════
   HomeExpenseTracker — site.js
   Global utilities: page loader, toast, edit/delete modals
   ═══════════════════════════════════════════════════════════ */

/* ── Page Loader ─────────────────────────────────────────── */
(function () {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;

    function hideLoader() {
        loader.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideLoader);
    } else {
        // Already ready — short pause for polish
        setTimeout(hideLoader, 300);
    }
})();

/* ── Toast System ────────────────────────────────────────── */
/**
 * showToast(message, type, duration)
 * type: 'success' | 'error' | 'warning'
 */
window.showToast = function (message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✓', error: '✗', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `het-toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '●'}</span>
        <span class="toast-body">${escHtml(message)}</span>
        <button class="toast-close" aria-label="Close">✕</button>
    `;

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    container.appendChild(toast);

    // Auto dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._dismissTimer = timer;
};

function dismissToast(toast) {
    if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
    toast.classList.add('dismissing');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 320);
}

/* ── Utility ─────────────────────────────────────────────── */
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getAntiForgeryToken() {
    const el = document.querySelector('input[name="__RequestVerificationToken"]');
    return el ? el.value : '';
}

function setButtonLoading(btn, loading) {
    if (!btn) return;
    const txtEl = btn.querySelector('.btn-text');
    const spinEl = btn.querySelector('.btn-spinner');
    btn.disabled = loading;
    if (txtEl) txtEl.classList.toggle('d-none', loading);
    if (spinEl) spinEl.classList.toggle('d-none', !loading);
}

/* ── Edit Modal ──────────────────────────────────────────── */
let _editModalInstance = null;

function getEditModal() {
    const el = document.getElementById('editModal');
    if (!el) return null;
    if (!_editModalInstance) {
        _editModalInstance = new bootstrap.Modal(el, { keyboard: true });
    }
    return _editModalInstance;
}

/**
 * openEditModal(id) — called from table row buttons
 */
window.openEditModal = async function (id) {
    const modal = getEditModal();
    const loaderDiv = document.getElementById('editModalLoader');
    const form = document.getElementById('editForm');
    if (!modal || !form) return;

    // Reset state
    loaderDiv && loaderDiv.classList.remove('d-none');
    form.classList.add('d-none');
    form.classList.remove('was-validated');

    modal.show();

    try {
        const res = await fetch(`/Expenses/Edit/${id}`);
        if (!res.ok) throw new Error('Could not load expense data.');
        const json = await res.json();
        if (!json.success) throw new Error('Could not load expense data.');
        const data = json.data;

        document.getElementById('editId').value = data.id;
        document.getElementById('editItemName').value = data.itemName || '';
        document.getElementById('editAmount').value = data.amount || '';
        document.getElementById('editCategory').value = data.category || '';
        document.getElementById('editDate').value = (data.date || '').slice(0, 10);
        document.getElementById('editNotes').value = data.notes || '';

        loaderDiv && loaderDiv.classList.add('d-none');
        form.classList.remove('d-none');

    } catch (err) {
        modal.hide();
        showToast(err.message || 'Failed to load expense.', 'error');
    }
};

/**
 * submitEditForm() — called by modal Save button
 */
window.submitEditForm = async function () {
    const form = document.getElementById('editForm');
    const saveBtn = document.getElementById('editSaveBtn');
    if (!form) return;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const id = document.getElementById('editId').value;
    setButtonLoading(saveBtn, true);

    const payload = {
        Id: parseInt(id),
        ItemName: document.getElementById('editItemName').value.trim(),
        Amount: parseFloat(document.getElementById('editAmount').value),
        Category: document.getElementById('editCategory').value,
        Date: document.getElementById('editDate').value,
        Notes: document.getElementById('editNotes').value.trim()
    };

    try {
        const res = await fetch(`/Expenses/Edit/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            getEditModal()?.hide();
            showToast('Expense updated successfully! ✏️', 'success');
            // Notify pages to reload
            document.dispatchEvent(new CustomEvent('expenseChanged'));
        } else {
            showToast(data.message || 'Could not update expense.', 'error');
        }
    } catch {
        showToast('Network error — please try again.', 'error');
    } finally {
        setButtonLoading(saveBtn, false);
    }
};

/* ── Delete Modal ────────────────────────────────────────── */
let _deleteModalInstance = null;
let _pendingDeleteId = null;

function getDeleteModal() {
    const el = document.getElementById('deleteModal');
    if (!el) return null;
    if (!_deleteModalInstance) {
        _deleteModalInstance = new bootstrap.Modal(el, { keyboard: true });
    }
    return _deleteModalInstance;
}

/**
 * openDeleteModal(id, name) — called from table row buttons
 */
window.openDeleteModal = function (id, name) {
    _pendingDeleteId = id;
    const nameEl = document.getElementById('deleteItemName');
    if (nameEl) nameEl.textContent = name;
    getDeleteModal()?.show();
};

/**
 * confirmDelete() — called by modal Confirm button
 */
window.confirmDelete = async function () {
    if (!_pendingDeleteId) return;

    const btn = document.getElementById('confirmDeleteBtn');
    setButtonLoading(btn, true);

    try {
        const res = await fetch(`/Expenses/Delete/${_pendingDeleteId}`, {
            method: 'POST',
            headers: {
                'RequestVerificationToken': getAntiForgeryToken()
            }
        });

        const data = await res.json();

        if (res.ok && data.success) {
            getDeleteModal()?.hide();
            showToast('Expense deleted.', 'success');

            // Fade out the matching table row if visible
            const rows = document.querySelectorAll(`[data-expense-id="${_pendingDeleteId}"]`);
            rows.forEach(r => {
                r.classList.add('fade-out-row');
                setTimeout(() => r.remove(), 380);
            });

            _pendingDeleteId = null;
            document.dispatchEvent(new CustomEvent('expenseChanged'));
        } else {
            showToast(data.message || 'Could not delete expense.', 'error');
        }
    } catch {
        showToast('Network error — please try again.', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

/* ── Active Navbar Link (client-side fallback) ──────────── */
document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname.toLowerCase();
    const links = document.querySelectorAll('.het-nav-link');
    links.forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href && path.startsWith(href) && href !== '/') {
            link.classList.add('active');
        } else if (href === '/' && path === '/') {
            link.classList.add('active');
        }
    });
});