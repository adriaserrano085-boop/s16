import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import playerService from '../services/playerService';
import attendanceService from '../services/attendanceService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

import './AttendancePage.css';

const AttendancePage = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('all');

    const months = [
        { key: 'all', label: 'Temporada' },
        { key: '2025-08', label: 'Agosto 2025' },
        { key: '2025-09', label: 'Septiembre 2025' },
        { key: '2025-10', label: 'Octubre 2025' },
        { key: '2025-11', label: 'Noviembre 2025' },
        { key: '2025-12', label: 'Diciembre 2025' },
        { key: '2026-01', label: 'Enero 2026' },
        { key: '2026-02', label: 'Febrero 2026' },
        { key: '2026-03', label: 'Marzo 2026' },
        { key: '2026-04', label: 'Abril 2026' },
        { key: '2026-05', label: 'Mayo 2026' },
        { key: '2026-06', label: 'Junio 2026' },
    ];

    useEffect(() => {
        fetchData();
    }, [user]);

    // Recalculate stats when month or data changes
    useEffect(() => {
        if (allPlayers.length > 0 && allAttendance.length > 0) {
            calculateStats();
        } else if (allPlayers.length > 0 && allAttendance.length === 0) {
            calculateStats();
        }
    }, [selectedMonth, allAttendance, allPlayers]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [players, attendance] = await Promise.all([
                playerService.getAll(),
                attendanceService.getAll()
            ]);

            // RBAC: If user is a Player, only show themselves
            if (user?.role === 'JUGADOR' && user.playerId) {
                const myself = players.find(p => p.id === user.playerId);
                setAllPlayers(myself ? [myself] : []);
            } else {
                setAllPlayers(players);
            }

            setAllAttendance(attendance || []);
            // calculateStats will be triggered by useEffect
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        // Filter attendance by selected month
        const filteredAttendance = allAttendance.filter(record => {
            if (selectedMonth === 'all') return true;

            // Check date in record.entrenamientos.evento_ref.fecha
            const eventDate = record.entrenamientos?.evento_ref?.fecha;
            if (!eventDate) return false;

            return eventDate.startsWith(selectedMonth);
        });

        // Calculate stats for each player
        const stats = allPlayers.map(player => {
            const playerAttendance = filteredAttendance.filter(a => a.jugador === player.id);
            const totalSessions = playerAttendance.length;

            const presentCount = playerAttendance.filter(a => a.asistencia === 'Presente').length;
            const lateCount = playerAttendance.filter(a => a.asistencia === 'Retraso').length;
            const JustifiedCount = playerAttendance.filter(a => a.asistencia === 'Falta Justificada').length;
            const MedicalCount = playerAttendance.filter(a => a.asistencia === 'Lesion' || a.asistencia === 'Enfermo').length;

            // Effective attendance: (Presente + Retraso) / Total
            const effectivePercentage = totalSessions > 0
                ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
                : 0;

            return {
                id: player.id,
                name: `${player.nombre} ${player.apellidos}`,
                total: totalSessions,
                present: presentCount,
                late: lateCount,
                justified: JustifiedCount,
                medical: MedicalCount,
                percentage: effectivePercentage,
                chartValue: effectivePercentage
            };
        });

        // Sort by percentage descending, then present count, then late count
        stats.sort((a, b) => {
            if (b.percentage !== a.percentage) {
                return b.percentage - a.percentage;
            }
            if (b.present !== a.present) {
                return b.present - a.present;
            }
            return b.late - a.late;
        });

        setAttendanceStats(stats);
    };

    const chartData = {
        labels: attendanceStats.map(p => p.name),
        datasets: [
            {
                label: 'Presente (%)',
                data: attendanceStats.map(p => p.total > 0 ? (p.present / p.total) * 100 : 0),
                backgroundColor: '#28a745',
                stack: 'Stack 0',
            },
            {
                label: 'Retraso (%)',
                data: attendanceStats.map(p => p.total > 0 ? (p.late / p.total) * 100 : 0),
                backgroundColor: '#ffc107',
                stack: 'Stack 0',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: selectedMonth === 'all'
                    ? 'Porcentaje de Asistencia Efec. (Temporada)'
                    : `Porcentaje de Asistencia Efec. (${months.find(m => m.key === selectedMonth)?.label})`
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += Math.round(context.parsed.y) + '%';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                beginAtZero: true,
                max: 100
            }
        }
    };

    return (
        <div className="attendance-page-container">
            <div className="attendance-content-wrapper">
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-back-dashboard">
                    &larr; Volver al Dashboard
                </button>

                <div className="attendance-card">
                    <div className="attendance-header">
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                            alt="Logo RCLH"
                            className="attendance-logo"
                        />
                        <h1 className="attendance-title">Asistencia General RC HOSPITALET</h1>
                    </div>

                    {loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center', color: '#666' }}>Cargando datos de asistencia...</div>
                    ) : (
                        <div>
                            {/* Tabs Navigation */}
                            <div className="months-tabs-container">
                                {months.map(month => (
                                    <button
                                        key={month.key}
                                        onClick={() => setSelectedMonth(month.key)}
                                        className="month-tab-button"
                                        style={{
                                            background: selectedMonth === month.key ? 'var(--color-primary-blue)' : '#f8f9fa',
                                            color: selectedMonth === month.key ? 'white' : '#495057',
                                            fontWeight: selectedMonth === month.key ? 'bold' : 'normal',
                                            boxShadow: selectedMonth === month.key ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        {month.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chart Section */}
                            <div className="attendance-chart-container">
                                <Bar data={chartData} options={chartOptions} />
                            </div>

                            {/* Table Section */}
                            <h3 className="table-section-title">
                                Detalle por Jugador - {months.find(m => m.key === selectedMonth)?.label}
                            </h3>
                            <div className="table-responsive">
                                <table className="attendance-table">
                                    <thead>
                                        <tr>
                                            <th style={{ color: '#495057' }}>Jugador</th>
                                            <th style={{ color: '#495057' }}>Sesiones</th>
                                            <th style={{ color: '#28a745' }}>Presente</th>
                                            <th style={{ color: '#ffc107' }}>Retraso</th>
                                            <th style={{ color: '#17a2b8' }}>Justif.</th>
                                            <th style={{ color: '#dc3545' }}>Falta</th>
                                            <th style={{ color: '#003366' }}>% Efec.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceStats.map((stat, idx) => (
                                            <tr key={stat.id}>
                                                <td>{stat.name}</td>
                                                <td>{stat.total}</td>
                                                <td style={{ color: '#28a745', fontWeight: 'bold' }}>{stat.present}</td>
                                                <td style={{ color: '#d39e00', fontWeight: 'bold' }}>{stat.late}</td>
                                                <td style={{ color: '#17a2b8' }}>{stat.justified}</td>
                                                <td style={{ color: '#dc3545' }}>
                                                    {stat.total - (stat.present + stat.late + stat.justified + stat.medical)}
                                                </td>
                                                <td>
                                                    <span className="percentage-badge" style={{
                                                        backgroundColor: stat.percentage >= 80 ? '#d4edda' : stat.percentage >= 50 ? '#fff3cd' : '#f8d7da',
                                                        color: stat.percentage >= 80 ? '#155724' : stat.percentage >= 50 ? '#856404' : '#721c24'
                                                    }}>
                                                        {stat.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceStats.length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                                    No hay datos de asistencia para este periodo.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
