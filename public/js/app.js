/**
 * AN GIANG SHIPPING - MAIN FRONTEND & ADMIN SYSTEM SCRIPT
 * File duy nhất xử lý toàn bộ logic cho cả index.html và admin.html
 */

// ==========================================
// 1. CÁC HÀM TIỆN ÍCH DÙNG CHUNG & TRANG CHỦ
// ==========================================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = `index.html#${sectionId}`;
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function initApp(viewType = 'homeView') {
    checkLoginState();

    if (viewType === 'homeView') {
        renderHomeStats();
        renderHomeVessels();
        renderHomeCustomers();
        checkUrlQueryParams();
    }
}

function checkLoginState() {
    const currentUser = localStorage.getItem('admin_current_user');
    const userRole = localStorage.getItem('admin_current_role') || 'Toàn quyền';

    const statusBadge = document.getElementById('userStatusBadge');
    const loginBtn = document.getElementById('navLoginBtn');
    const logoutBtn = document.getElementById('navLogoutBtn');
    const adminTabBtn = document.getElementById('adminTabBtn');
    const mobileAdminBtn = document.getElementById('mobileAdminBtn');

    if (currentUser) {
        if (statusBadge) {
            statusBadge.innerHTML = `<i class="fa-solid fa-user-shield me-1 text-emerald-400"></i> Xin chào: <strong>${currentUser}</strong> (${userRole})`;
            statusBadge.className = "bg-emerald-900/60 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-emerald-500/30";
        }
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (adminTabBtn) adminTabBtn.classList.remove('hidden');
        if (mobileAdminBtn) mobileAdminBtn.classList.remove('hidden');
    } else {
        if (statusBadge) {
            statusBadge.innerHTML = `<i class="fa-solid fa-user-shield me-1"></i> Chế độ: Khách ghé thăm`;
        }
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (adminTabBtn) adminTabBtn.classList.add('hidden');
        if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
    }
}

function logout() {
    if (confirm('Bạn có muốn đăng xuất khỏi hệ thống?')) {
        localStorage.removeItem('admin_current_user');
        localStorage.removeItem('admin_current_role');
        window.location.href = '/';
    }
}

function renderHomeStats() {
    const vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const departures = JSON.parse(localStorage.getItem('admin_departures') || '[]');
    const crew = JSON.parse(localStorage.getItem('admin_crew') || '[]');
    const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');

    const elVessels = document.getElementById('statVessels');
    const elRoutes = document.getElementById('statRoutes');
    const elCrew = document.getElementById('statCrew');
    const elOrders = document.getElementById('statOrders');

    if (elVessels) elVessels.innerText = vessels.length;
    if (elRoutes) elRoutes.innerText = departures.length;
    if (elCrew) elCrew.innerText = crew.length;
    if (elOrders) elOrders.innerText = orders.length;
}

function renderHomeVessels() {
    const keyword = (document.getElementById('homeSearchVessel')?.value || '').toLowerCase();
    const vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const departures = JSON.parse(localStorage.getItem('admin_departures') || '[]');
    const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
    const crewList = JSON.parse(localStorage.getItem('admin_crew') || '[]');
    const grid = document.getElementById('homeVesselsGrid');

    if (!grid) return;

    const filtered = vessels.filter(v => 
        v.name.toLowerCase().includes(keyword) || 
        v.code.toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-3 text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200">Không tìm thấy tàu phù hợp với từ khóa tìm kiếm.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(v => {
        const dep = departures.find(d => d.vesselId == v.id);
        const isSailing = !!dep;
        
        const statusBadge = isSailing 
            ? `<span class="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                 <i class="fa-solid fa-compass text-emerald-600 animate-spin" style="animation-duration: 4s;"></i> Đang Vận Chuyển
               </span>`
            : `<span class="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                 <i class="fa-solid fa-anchor text-slate-500 text-[10px]"></i> Đang Nằm Ở Cảng
               </span>`;

        const routeText = isSailing ? `${dep.fromPort} → ${dep.toPort}` : 'Đang neo đậu tại cảng chính';
        const timeText = isSailing ? `${dep.time ? dep.time.replace('T', ' ') : 'N/A'} → Dự kiến: ${dep.eta ? dep.eta.replace('T', ' ') : 'N/A'}` : 'N/A';
        
        let cargoWeightText = '0 Tấn';
        let customerNames = 'Chưa có đơn hàng';
        if (isSailing && dep.orderIds && dep.orderIds.length > 0) {
            let sumWeight = 0;
            const custs = [];
            dep.orderIds.forEach(oid => {
                const ord = orders.find(o => o.id == oid);
                if (ord) {
                    sumWeight += parseFloat(ord.weight || 0);
                    if (!custs.includes(ord.customerName)) custs.push(ord.customerName);
                }
            });
            cargoWeightText = `${sumWeight.toLocaleString()} Tấn`;
            customerNames = custs.join(', ');
        }

        let crewNames = 'Chưa phân công';
        if (isSailing && dep.crewIds && dep.crewIds.length > 0) {
            const assigned = dep.crewIds.map(cid => {
                const c = crewList.find(x => x.id == cid);
                return c ? `${c.role}: ${c.name}` : null;
            }).filter(Boolean);
            if (assigned.length > 0) crewNames = assigned.join(', ');
        }

        const vesselGps = (dep && dep.gpsLink) ? dep.gpsLink : (v.gpsLink || 'https://www.marinetraffic.com');

        return `
            <div id="vessel-card-${v.code}" class="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition flex flex-col justify-between space-y-4">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-9 h-9 rounded-lg bg-sky-50 text-ocean-600 flex items-center justify-center border border-sky-100">
                                <i class="fa-solid fa-ship ${isSailing ? 'fa-bounce text-cyan-600' : ''}"></i>
                            </div>
                            <h3 class="font-black text-slate-900 text-lg">${v.name}</h3>
                        </div>
                        ${statusBadge}
                    </div>
                    <p class="text-xs text-slate-500 mb-4 ms-11">Số hiệu: <span class="font-mono font-bold text-slate-700">${v.code}</span> | Trọng tải: <strong class="text-slate-700">${(v.dwt || 0).toLocaleString()} DWT</strong></p>

                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-slate-500">Lộ trình hải trình:</span> 
                            <strong class="text-ocean-700">${routeText}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Khởi hành / Dự kiến đến:</span> 
                            <strong class="text-slate-800">${timeText}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Trọng tải thực chở:</span> 
                            <strong class="text-emerald-700">${cargoWeightText}</strong>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Khách hàng gửi hàng:</span> 
                            <strong class="text-slate-800">${customerNames}</strong>
                        </div>
                        <div class="pt-2 border-t border-slate-200">
                            <span class="text-slate-500 block mb-1"><i class="fa-solid fa-users me-1 text-ocean-500"></i> Thủy thủ đoàn vận hành:</span>
                            <div class="bg-white p-2.5 rounded border border-slate-200 text-slate-700 font-medium">
                                ${crewNames}
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="openGpsModal('${v.name}', '${isSailing ? dep.fromPort : 'Cảng chính'}', '${isSailing ? dep.toPort : 'Cảng chính'}', '${vesselGps}')" class="w-full bg-[#0284c7] hover:bg-[#075985] text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow">
                    <i class="fa-solid fa-location-crosshairs"></i> Tracking GPS Lộ Trình Tàu
                </button>
            </div>
        `;
    }).join('');
}

function renderHomeCustomers() {
    const customersList = JSON.parse(localStorage.getItem('admin_customers') || '[]');
    const container = document.getElementById('homeCustomersList');
    if (!container) return;

    if (customersList.length > 0) {
        container.innerHTML = customersList.map(c => `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 bg-ocean-100 text-ocean-600 rounded-xl flex items-center justify-center font-bold text-lg border border-ocean-200">
                    ${c.name.charAt(0)}
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${c.name}</h4>
                    <p class="text-xs text-slate-500">Mã KH: <strong class="text-ocean-600">${c.code || 'KH-Vip'}</strong> - SĐT: ${c.phone}</p>
                </div>
            </div>
        `).join('');
    }
}

function checkUrlQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingCode = urlParams.get('tracking');
    const departureCode = urlParams.get('departure');

    if (trackingCode) {
        const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
        const ord = orders.find(o => o.code === trackingCode);
        if (ord) {
            alert(`🔍 HỆ THỐNG TRA CỨU ĐƠN HÀNG (MÃ QR):\n\n- Mã Đơn Hàng: ${ord.code}\n- Khách Hàng: ${ord.customerName}\n- Hàng Hóa: ${ord.goodsType || 'Hàng rời'} (${ord.weight} Tấn)\n- Lộ Trình: ${ord.fromPort} → ${ord.toPort}\n- Trạng Thái: Đang vận chuyển`);
            scrollToSection('vessels');
        }
    } else if (departureCode) {
        const departures = JSON.parse(localStorage.getItem('admin_departures') || '[]');
        const dep = departures.find(d => d.codeNumber === departureCode);
        if (dep) {
            alert(`🔍 HỆ THỐNG TRA CỨU LỆNH XUẤT CẢNG:\n\n- Số Lệnh Xuất: ${dep.codeNumber}\n- Hải Trình: ${dep.fromPort} → ${dep.toPort}\n- Thời Gian Khởi Hành: ${dep.time ? dep.time.replace('T', ' ') : 'N/A'}`);
            scrollToSection('vessels');
        }
    }
}

function openGpsModal(vesselName, fromPort, toPort, gpsLink) {
    const modal = document.getElementById('gpsModal');
    if (!modal) return;

    const elName = document.getElementById('gpsModalVesselName');
    const elRoute = document.getElementById('gpsModalRoute');
    const elFrom = document.getElementById('gpsModalFromPort');
    const elTo = document.getElementById('gpsModalToPort');

    if (elName) elName.innerText = vesselName;
    if (elRoute) elRoute.innerText = `${fromPort} -> ${toPort}`;
    if (elFrom) elFrom.innerText = fromPort;
    if (elTo) elTo.innerText = toPort;

    const externalLinkBtn = document.getElementById('gpsModalExternalLink');
    if (externalLinkBtn) {
        externalLinkBtn.href = gpsLink || 'https://www.marinetraffic.com';
    }

    modal.classList.remove('hidden');
}

function closeGpsModal() {
    const modal = document.getElementById('gpsModal');
    if (modal) modal.classList.add('hidden');
}

// ==========================================
// 2. KHỞI TẠO DỮ LIỆU MẶC ĐỊNH CHO HỆ THỐNG
// ==========================================

function initDefaultAdminData() {
    if (!localStorage.getItem('admin_vessels')) {
        localStorage.setItem('admin_vessels', JSON.stringify([
            { id: 1, name: 'Đại Dương Ocean Star', code: 'IMO-982173', dwt: 50000, value: '15,000,000 USD', date: '2023-05-10', license1: 'GP1: VR-2026-A1', license2: 'GP2: ATHH-9988<br>GP3: GPXC-2026-10', gpsLink: 'https://www.marinetraffic.com' },
            { id: 2, name: 'Hải Phong Pioneer', code: 'IMO-914201', dwt: 35000, value: '10,500,000 USD', date: '2022-11-15', license1: 'GP1: VR-2026-B2', license2: 'GP2: ATHH-7744<br>GP3: GPXC-2026-11', gpsLink: 'https://www.marinetraffic.com' },
            { id: 3, name: 'Biển Đông Titan', code: 'IMO-993412', dwt: 75000, value: '22,000,000 USD', date: '2024-01-20', license1: 'GP1: VR-2026-C3', license2: 'GP2: ATHH-5522<br>GP3: GPXC-2026-12', gpsLink: 'https://www.marinetraffic.com' },
            { id: 4, name: 'Thiên Ân', code: 'IMO-12345', dwt: 80000, value: '30,000,000 USD', date: '2026-10-28', license1: 'GP1: VR-2026-A1', license2: 'GP2: ATHH-9988<br>GP3: GPXC-2026-10', gpsLink: 'https://www.marinetraffic.com' }
        ]));
    }
    if (!localStorage.getItem('admin_orders')) {
        localStorage.setItem('admin_orders', JSON.stringify([
            { id: 1, orderCategory: 'Đơn xuất', code: 'DH-2026-001', customerName: 'Tập đoàn Hòa Phát', customerPhone: '0918112233', goodsType: 'Thép Cuộn Khổ Lớn', weight: 20000, fromPort: 'Cảng Bến Nghé - TP.HCM', toPort: 'Cảng Hải Phòng', shippingFee: 950000000, insuranceFee: 50000000 },
            { id: 2, orderCategory: 'Đơn nhập', code: 'DH-2026-002', customerName: 'Công ty Nông Sản Vina', customerPhone: '0903889900', goodsType: 'Gạo Xuất Khẩu Bulk', weight: 15000, fromPort: 'Cảng Quy Nhơn', toPort: 'Cảng Cần Thơ', shippingFee: 620000000, insuranceFee: 30000000 }
        ]));
    }
    if (!localStorage.getItem('admin_crew')) {
        localStorage.setItem('admin_crew', JSON.stringify([
            { id: 1, role: 'Thuyền trưởng', name: 'Nguyễn Văn Hùng', phone: '0908123456', cccd: '036085001234', passport: 'B1234567', passportExpiry: '2028-10-10', salary: 50000000, experience: 15 },
            { id: 2, role: 'Máy trưởng', name: 'Trần Đình Trọng', phone: '0912987654', cccd: '036085005678', passport: 'B2233445', passportExpiry: '2029-05-12', salary: 45000000, experience: 12 },
            { id: 3, role: 'Thuyền phó 1', name: 'Lê Hoàng Nam', phone: '0933445566', cccd: '036085009988', passport: 'B9988776', passportExpiry: '2027-11-20', salary: 35000000, experience: 8 },
            { id: 4, role: 'Thủy thủ trưởng', name: 'Phạm Quốc Bảo', phone: '0977112233', cccd: '036085007711', passport: 'B5544332', passportExpiry: '2028-01-15', salary: 28000000, experience: 6 }
        ]));
    }
    if (!localStorage.getItem('admin_customers')) {
        localStorage.setItem('admin_customers', JSON.stringify([
            { id: 1, name: 'Tập đoàn Hòa Phát', phone: '0918112233', code: 'KH-HP01', brand: 'Hòa Phát Corp', address: 'KCN Thăng Long, Hà Nội', notes: 'Khách hàng VIP' },
            { id: 2, name: 'Tập đoàn Hoa Sen', phone: '0903889900', code: 'KH-HS02', brand: 'Hoa Sen Group', address: 'KCN Sóng Thần, Bình Dương', notes: 'Chuyên gửi Tôn cuộn' }
        ]));
    }
    if (!localStorage.getItem('admin_departures')) {
        localStorage.setItem('admin_departures', JSON.stringify([
            { id: 1, codeNumber: 'LXC-2026-01', vesselId: 1, orderIds: [1], crewIds: [1, 2, 3, 4], fromPort: 'Cảng Hải Phòng', toPort: 'Cảng Bến Nghé', time: '2026-03-02T08:00', eta: '2026-03-05T18:00', gpsLink: 'https://www.marinetraffic.com' }
        ]));
    }
}

// ==========================================
// 3. TOÀN BỘ CÁC HÀM XỬ LÝ ADMIN (ADMIN.HTML)
// ==========================================

function switchAdminTab(tabKey) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-ocean-500', 'text-white', 'shadow');
        b.classList.add('text-slate-600', 'hover:bg-slate-100');
    });
    const activePanel = document.getElementById(`panel-${tabKey}`);
    if (activePanel) activePanel.classList.remove('hidden');
    
    const activeBtn = document.getElementById(`tabBtn-${tabKey}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-ocean-500', 'text-white', 'shadow');
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    }
    refreshTabData(tabKey);
}

function refreshTabData(tabKey) {
    if (tabKey === 'vessels') renderAdminVessels();
    if (tabKey === 'maintenance') { renderMaintenanceTable(); populateSelectOptions(); }
    if (tabKey === 'crew') { renderCrewTable(); populateDepartureCrewOptions(); }
    if (tabKey === 'customers') renderCustomersTable();
    if (tabKey === 'orders') renderOrdersTable();
    if (tabKey === 'departure') { renderDepartureTable(); populateDepartureOptions(); populateDepartureCrewOptions(); }
    if (tabKey === 'arrival') { renderArrivalTable(); populateArrivalOrderOptions(); }
    if (tabKey === 'expenses') renderExpensesTable();
    if (tabKey === 'revenue') renderRevenueTable();
    if (tabKey === 'users') renderUsersTable();
}

// 1. Quản lý Tàu
function saveVessel(e) {
    if(e) e.preventDefault();
    let vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const editId = document.getElementById('vesselEditId')?.value;
    
    const vesselData = {
        id: editId ? parseInt(editId) : Date.now(),
        name: document.getElementById('vesselName').value,
        code: document.getElementById('vesselCode').value,
        dwt: parseFloat(document.getElementById('vesselDwt').value || 0),
        value: document.getElementById('vesselValue').value,
        date: document.getElementById('vesselDate')?.value || '',
        license1: document.getElementById('vesselLicense1')?.value || '',
        license2: document.getElementById('vesselLicense2')?.value || '',
        gpsLink: document.getElementById('vesselGpsLink')?.value || 'https://www.marinetraffic.com'
    };

    if (editId) {
        const idx = vessels.findIndex(v => v.id == editId);
        if (idx !== -1) vessels[idx] = vesselData;
    } else {
        vessels.push(vesselData);
    }

    localStorage.setItem('admin_vessels', JSON.stringify(vessels));
    resetVesselForm();
    renderAdminVessels();
    alert('Đã lưu thông tin tàu thành công!');
}

function renderAdminVessels() {
    const keyword = (document.getElementById('adminVesselSearch')?.value || '').toLowerCase();
    let vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const tbody = document.getElementById('adminVesselsTableBody');
    if (!tbody) return;

    const filtered = vessels.filter(v => v.name.toLowerCase().includes(keyword) || v.code.toLowerCase().includes(keyword));

    tbody.innerHTML = filtered.map(v => `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-3"><strong>${v.name}</strong><br><span class="text-slate-500 font-mono text-[11px]">Số hiệu: ${v.code}</span></td>
            <td class="p-3 font-semibold text-ocean-600">${(v.dwt || 0).toLocaleString()} Tấn</td>
            <td class="p-3">${v.value || '---'}</td>
            <td class="p-3">${v.date ? v.date.split('-').reverse().join('/') : '---'}</td>
            <td class="p-3 text-[11px] text-slate-600 font-mono">
                ${v.license1 ? `<div>${v.license1}</div>` : ''}
                ${v.license2 ? `<div>${v.license2}</div>` : ''}
            </td>
            <td class="p-3 text-right">
                <button onclick="editVessel(${v.id})" class="text-ocean-600 font-semibold mr-2 hover:underline"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>
                <button onclick="deleteVessel(${v.id})" class="text-rose-600 font-semibold hover:underline"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || `<tr><td colspan="6" class="p-4 text-center text-slate-400">Không tìm thấy tàu phù hợp</td></tr>`;
}

function resetVesselForm() {
    document.getElementById('vesselForm')?.reset();
    if(document.getElementById('vesselEditId')) document.getElementById('vesselEditId').value = '';
    const titleEl = document.getElementById('vesselFormTitle');
    if(titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus-circle text-ocean-500 me-1"></i> Thêm Tàu Mới';
    const btnEl = document.getElementById('vesselSubmitBtn');
    if(btnEl) btnEl.innerText = 'Lưu Thông Tin Tàu';
}

function editVessel(id) {
    const vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const v = vessels.find(x => x.id == id);
    if (!v) return;
    document.getElementById('vesselEditId').value = v.id;
    document.getElementById('vesselName').value = v.name;
    document.getElementById('vesselCode').value = v.code;
    document.getElementById('vesselDwt').value = v.dwt;
    document.getElementById('vesselValue').value = v.value || '';
    if(document.getElementById('vesselDate')) document.getElementById('vesselDate').value = v.date || '';
    if(document.getElementById('vesselLicense1')) document.getElementById('vesselLicense1').value = v.license1 || '';
    if(document.getElementById('vesselLicense2')) document.getElementById('vesselLicense2').value = v.license2 || '';
    if(document.getElementById('vesselGpsLink')) document.getElementById('vesselGpsLink').value = v.gpsLink || '';

    const titleEl = document.getElementById('vesselFormTitle');
    if(titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square text-ocean-500 me-1"></i> Sửa Thông Tin Tàu';
    const btnEl = document.getElementById('vesselSubmitBtn');
    if(btnEl) btnEl.innerText = 'Cập Nhật Tàu';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteVessel(id) {
    if(!confirm('Bạn có chắc chắn muốn xóa tàu này khỏi hạm đội?')) return;
    let list = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    localStorage.setItem('admin_vessels', JSON.stringify(list.filter(v => v.id != id)));
    renderAdminVessels();
}

// Populate Thủy Thủ Đoàn
function populateDepartureCrewOptions() {
    const crewList = JSON.parse(localStorage.getItem('admin_crew') || '[]');
    const selectEl = document.getElementById('depCrewSelect');
    if(!selectEl) return;
    selectEl.innerHTML = crewList.map(c => 
        `<option value="${c.id}">${c.role}: ${c.name} (${c.phone})</option>`
    ).join('');
}

function populateDepartureOptions() {
    const vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const orders = JSON.parse(localStorage.getItem('admin_orders') || '[]');

    const vEl = document.getElementById('depVesselSelect');
    if(vEl) vEl.innerHTML = `<option value="">-- Chọn tàu xuất cảng --</option>` + vessels.map(v => `<option value="${v.id}">${v.name} (${v.code})</option>`).join('');

    const oEl = document.getElementById('depOrdersSelect');
    if(oEl) {
        const exportOrders = orders.filter(o => !o.orderCategory || o.orderCategory === 'Đơn xuất');
        oEl.innerHTML = exportOrders.map(o => `<option value="${o.id}">${o.code} | KH: ${o.customerName} | ${o.goodsType || 'Hàng rời'} (${o.weight} Tấn)</option>`).join('');
    }
}

function populateSelectOptions() {
    const vessels = JSON.parse(localStorage.getItem('admin_vessels') || '[]');
    const vesselOpts = vessels.map(v => `<option value="${v.id}">${v.name} (${v.code})</option>`).join('');
    const el = document.getElementById('maintVesselSelect');
    if (el) el.innerHTML = `<option value="">-- Chọn tàu biển --</option>` + vesselOpts;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Đã chép đường dẫn xem lộ trình tab index.html!');
    });
}

// GẮN TẤT CẢ CÁC HÀM QUẢN TRỊ VÀO PHẠM VI GLOBAL (WINDOW) ĐỂ KHÔNG BỊ LỖI UNCAUGHT REFERENCE ERROR
window.switchAdminTab = switchAdminTab;
window.refreshTabData = refreshTabData;
window.saveVessel = saveVessel;
window.renderAdminVessels = renderAdminVessels;
window.resetVesselForm = resetVesselForm;
window.editVessel = editVessel;
window.deleteVessel = deleteVessel;
window.populateDepartureCrewOptions = populateDepartureCrewOptions;
window.populateDepartureOptions = populateDepartureOptions;
window.populateSelectOptions = populateSelectOptions;
window.copyToClipboard = copyToClipboard;
window.scrollToSection = scrollToSection;
window.toggleMobileMenu = toggleMobileMenu;
window.logout = logout;
window.openGpsModal = openGpsModal;
window.closeGpsModal = closeGpsModal;

// Tự động khởi tạo dữ liệu
initDefaultAdminData();

// Tự động chạy khi tải xong
window.addEventListener('DOMContentLoaded', () => {
    initApp('homeView');
    if (document.getElementById('adminVesselsTableBody')) {
        renderAdminVessels();
    }
});