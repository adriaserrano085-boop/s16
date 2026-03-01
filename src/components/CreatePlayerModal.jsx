
import React, { useState, useRef } from 'react';
import { X, User, Camera, Loader2, Save, CalendarDays, Hash, Ruler, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import playerService from '../services/playerService';
import './CreatePlayerModal.css';

const CreatePlayerModal = ({ onClose, onPlayerCreated }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        posiciones: '',
        talla: '',
        licencia: '',
        email: '',
        Telefono: '',
        fecha_nacimiento: '',
        foto: null
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `jugadores/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('Imagenes Jugadores')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('Imagenes Jugadores')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, foto: publicUrl }));
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error al subir la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.nombre || !formData.apellidos) {
            alert('Nombre y apellidos son obligatorios');
            return;
        }

        try {
            setSaving(true);
            // Clean up empty strings to null for backend if needed, or just send as is
            const submissionData = { ...formData };
            if (!submissionData.fecha_nacimiento) delete submissionData.fecha_nacimiento;

            await playerService.create(submissionData);
            onPlayerCreated();
        } catch (error) {
            console.error('Error creating player:', error);
            alert('Error al crear el jugador');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="player-details-overlay" onClick={onClose}>
            <div className="player-details-content create-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="player-details-header create-header">
                    <div className="player-header-info">
                        <div
                            className="player-header-photo-container editable"
                            onClick={handlePhotoClick}
                        >
                            {formData.foto ? (
                                <img src={formData.foto} alt="Preview" className="player-header-photo" />
                            ) : (
                                <div className="player-header-photo placeholder">
                                    <User size={40} color="#64748b" />
                                </div>
                            )}
                            <div className="photo-edit-overlay" style={{ opacity: uploading ? 1 : undefined }}>
                                {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="player-header-text">
                            <h2 style={{ color: '#1e293b', marginBottom: '4px' }}>Nuevo Jugador</h2>
                            <p>Completa la ficha técnica</p>
                        </div>
                    </div>
                </div>

                <div className="player-details-body">
                    <div className="details-grid">
                        <div className="detail-group">
                            <label>Nombre *</label>
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="Ej: Johan"
                                required
                            />
                        </div>
                        <div className="detail-group">
                            <label>Apellidos *</label>
                            <input
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="Ej: Perez"
                                required
                            />
                        </div>

                        <div className="detail-group full-width">
                            <label>Posiciones (separadas por coma o intro)</label>
                            <textarea
                                name="posiciones"
                                value={formData.posiciones}
                                onChange={handleInputChange}
                                className="edit-input"
                                rows={2}
                                placeholder="Ej: 11-14, 6-7"
                            />
                        </div>

                        <div className="detail-group">
                            <label><CalendarDays size={14} style={{ marginRight: '4px' }} /> Fecha Nacimiento</label>
                            <input
                                type="date"
                                name="fecha_nacimiento"
                                value={formData.fecha_nacimiento}
                                onChange={handleInputChange}
                                className="edit-input"
                            />
                        </div>

                        <div className="detail-group">
                            <label><Hash size={14} style={{ marginRight: '4px' }} /> Licencia</label>
                            <input
                                name="licencia"
                                value={formData.licencia}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="Número de ficha"
                            />
                        </div>

                        <div className="detail-group">
                            <label><Ruler size={14} style={{ marginRight: '4px' }} /> Talla</label>
                            <input
                                name="talla"
                                value={formData.talla}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="Ej: L, XL"
                            />
                        </div>

                        <div className="detail-group">
                            <label><Phone size={14} style={{ marginRight: '4px' }} /> Móvil</label>
                            <input
                                name="Telefono"
                                value={formData.Telefono}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="Ej: 600000000"
                            />
                        </div>

                        <div className="detail-group full-width">
                            <label><Mail size={14} style={{ marginRight: '4px' }} /> Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="edit-input"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="create-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button className="btn-save-new" onClick={handleSave} disabled={saving || uploading}>
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Save size={18} style={{ marginRight: '8px' }} />
                                Crear Jugador
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePlayerModal;
