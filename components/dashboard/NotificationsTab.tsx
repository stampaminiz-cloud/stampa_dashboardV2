'use client'
import React, { useState } from 'react'
import { useLang } from '@/data/i18n'
import { usePlan } from '@/data/plans'

type Audience = 'All' | 'Near prize' | 'Inactive'
type SendType = 'instant' | 'scheduled'

interface ScheduledNotif { id: string; message: string; audience: Audience; scheduledAt: string }
interface SentNotif      { id: string; message: string; audience: Audience; sentCount: number; sentAt: string }
interface NotificationsData { scheduledNotifications: ScheduledNotif[]; sentNotifications: SentNotif[] }

export function NotificationsTab({ data, businessId, analyticsData, rewardsData }: { 
  data: NotificationsData
  businessId?: string | null
  analyticsData?: any
  rewardsData?: any
}) 
{  
  const t = useLang()
  const { limit } = usePlan()
  const notifLimit = limit('monthlyNotifs')
  const [message, setMessage]         = useState('')
  const [audience, setAudience]       = useState<Audience>('All')
  const [sendType, setSendType]       = useState<SendType>('instant')
  const [schedDate, setSchedDate]     = useState('')
  const [schedTime, setSchedTime]     = useState('')
  const [scheduled, setScheduled]     = useState<ScheduledNotif[]>(data.scheduledNotifications)
  const [sent, setSent]               = useState<SentNotif[]>(data.sentNotifications)
  const atNotifLimit = notifLimit < 999999 && sent.length >= notifLimit
  const [sentSuccess, setSentSuccess] = useState(false)
  const [charCount, setCharCount]     = useState(0)
  const MAX_CHARS = 160

  const AUDIENCES = [
    { key: 'All' as Audience, label: t('nt_all'), desc: t('nt_all_desc'), count: analyticsData?.total ?? 4821, color: '#2B2620', bg: 'rgba(43,38,32,.06)' },
    { key: 'Near prize' as Audience, label: t('nt_near'), desc: t('nt_near_desc'), count: rewardsData?.nearPrize ?? 23, color: '#C75D3A', bg: 'rgba(199,93,58,.08)' },
    { key: 'Inactive' as Audience, label: t('nt_inactive'), desc: t('nt_inactive_desc'), count: analyticsData?.inactive ?? 1432, color: '#B23B3B', bg: 'rgba(178,59,59,.07)' },
  ]

  const AUDIENCE_LABELS: Record<Audience, string> = {
    'All': t('nt_all'), 'Near prize': t('nt_near'), 'Inactive': t('nt_inactive'),
  }

  const selectedAudience = AUDIENCES.find(a => a.key === audience)!

  function handleMessage(val: string) {
    if (val.length <= MAX_CHARS) { setMessage(val); setCharCount(val.length) }
  }

  async function handleSend() {
    if (!message.trim()) return
    if (sendType === 'scheduled') {
      if (!schedDate || !schedTime) return
      if (businessId) {
        try {
          await fetch(`http://localhost:5002/api/businesses/${businessId}/notifications/scheduled`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('stampa_token')
            },
            body: JSON.stringify({
              message,
              audience: audience.toLowerCase().replace(' ', '_'),
              scheduledAt: new Date(`${schedDate}T${schedTime}`).toISOString()
            })
          })
        } catch (err) { console.error('Error scheduling:', err) }
      }
      setScheduled([{ id: Date.now().toString(), message, audience, scheduledAt: `${schedDate}, ${schedTime}` }, ...scheduled])
    } else {
      if (businessId) {
        try {
          const res = await fetch(`http://localhost:5002/api/businesses/${businessId}/notifications/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('stampa_token')
            },
            body: JSON.stringify({
              message,
              audience: audience.toLowerCase().replace(' ', '_'),
            })
          })
          const result = await res.json()
          setSent([{ id: Date.now().toString(), message, audience, sentCount: result.sent || 0, sentAt: t('now') }, ...sent])
        } catch (err) {
          console.error('Error broadcasting:', err)
          setSent([{ id: Date.now().toString(), message, audience, sentCount: 0, sentAt: t('now') }, ...sent])
        }
      } else {
        setSent([{ id: Date.now().toString(), message, audience, sentCount: selectedAudience.count, sentAt: t('now') }, ...sent])
      }
      setSentSuccess(true)
      setTimeout(() => setSentSuccess(false), 3000)
    }
    setMessage(''); setCharCount(0)
  }

  function cancelScheduled(id: string) { setScheduled(scheduled.filter((n: ScheduledNotif) => n.id !== id)) }

  return (
    <>
      <style>{`
        .nt-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .nt-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .nt-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
        .nt-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:18px 20px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .nt-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .nt-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:16px;}
        .nt-2col{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;}
        .nt-textarea{width:100%;padding:12px 14px;font-size:13px;border:1.5px solid rgba(43,38,32,.12);border-radius:11px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;resize:none;outline:none;line-height:1.6;min-height:100px;}
        .nt-textarea:focus{border-color:#C75D3A;}
        .nt-char-count{text-align:right;font-size:10px;color:rgba(43,38,32,.38);margin-bottom:14px;}
        .nt-char-count--warn{color:#C75D3A;font-weight:600;}
        .nt-field-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.45);font-weight:700;margin-bottom:8px;}
        .nt-audience-grid{display:flex;flex-direction:column;gap:6px;}
        .nt-audience-opt{display:flex;align-items:center;gap:10px;padding:10px 13px;border:1.5px solid rgba(43,38,32,.1);border-radius:11px;cursor:pointer;transition:all .15s;}
        .nt-audience-opt:hover{border-color:rgba(43,38,32,.2);}
        .nt-audience-opt--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
        .nt-aud-radio{width:15px;height:15px;border-radius:50%;border:2px solid rgba(43,38,32,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .nt-audience-opt--on .nt-aud-radio{border-color:#C75D3A;}
        .nt-aud-dot{width:7px;height:7px;border-radius:50%;background:#C75D3A;}
        .nt-aud-info{flex:1;}
        .nt-aud-name{font-size:12px;font-weight:700;color:#2B2620;}
        .nt-aud-desc{font-size:10.5px;color:rgba(43,38,32,.45);margin-top:1px;}
        .nt-aud-count{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;}
        .nt-send-type{display:flex;gap:6px;margin-bottom:12px;}
        .nt-type-btn{flex:1;padding:9px;border-radius:10px;border:1.5px solid rgba(43,38,32,.1);background:#FFFFFF;cursor:pointer;font-size:12px;font-weight:600;color:rgba(43,38,32,.5);transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px;font-family:'Inter',sans-serif;}
        .nt-type-btn--on{border-color:#C75D3A;background:rgba(199,93,58,.06);color:#C75D3A;}
        .nt-sched-inputs{display:flex;gap:8px;margin-bottom:12px;}
        .nt-date-input{flex:1;padding:8px 11px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:9px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .nt-date-input:focus{border-color:#C75D3A;}
        .nt-preview-card{background:#1E3329;border-radius:14px;padding:16px;margin-bottom:14px;}
        .nt-preview-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
        .nt-preview-logo{width:24px;height:24px;border-radius:6px;background:#C75D3A;}
        .nt-preview-app{font-size:11px;color:rgba(247,240,228,.6);}
        .nt-preview-message{font-size:13px;color:#F7F0E4;line-height:1.5;margin-bottom:6px;}
        .nt-preview-placeholder{font-size:13px;color:rgba(247,240,228,.3);font-style:italic;line-height:1.5;margin-bottom:6px;}
        .nt-preview-reach{font-size:10.5px;color:rgba(247,240,228,.45);}
        .nt-send-btn{width:100%;background:#C75D3A;color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .15s;margin-top:4px;}
        .nt-send-btn:hover{background:#B14F2F;}
        .nt-send-btn:disabled{opacity:.4;cursor:not-allowed;}
        .nt-success{display:flex;align-items:center;gap:8px;padding:12px 14px;background:rgba(91,140,90,.12);border-radius:10px;font-size:12.5px;color:#5B8C5A;font-weight:600;}
        .nt-sched-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(43,38,32,.06);}
        .nt-sched-row:last-child{border-bottom:none;}
        .nt-sched-icon{width:32px;height:32px;border-radius:9px;background:rgba(24,95,165,.1);display:flex;align-items:center;justify-content:center;color:#185FA5;flex-shrink:0;}
        .nt-sched-info{flex:1;}
        .nt-sched-msg{font-size:12.5px;color:#2B2620;font-weight:500;margin-bottom:4px;}
        .nt-sched-meta{display:flex;align-items:center;gap:8px;}
        .nt-sched-time{font-size:11px;color:rgba(43,38,32,.45);}
        .nt-cancel-btn{font-size:11px;color:#B23B3B;background:none;border:none;cursor:pointer;font-weight:600;padding:4px 8px;border-radius:6px;flex-shrink:0;}
        .nt-cancel-btn:hover{background:rgba(178,59,59,.08);}
        .nt-empty{font-size:12px;color:rgba(43,38,32,.35);text-align:center;padding:20px 0;}
        .nt-aud-badge{font-size:10px;padding:2px 9px;border-radius:20px;font-weight:600;}
        .nt-hist-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(43,38,32,.06);}
        .nt-hist-row:last-child{border-bottom:none;}
        .nt-hist-icon{width:32px;height:32px;border-radius:9px;background:rgba(91,140,90,.1);display:flex;align-items:center;justify-content:center;color:#5B8C5A;flex-shrink:0;}
        .nt-hist-info{flex:1;}
        .nt-hist-msg{font-size:12.5px;color:#2B2620;font-weight:500;margin-bottom:4px;}
        .nt-hist-meta{display:flex;align-items:center;gap:8px;}
        .nt-hist-reach{font-size:11px;font-weight:700;color:#5B8C5A;}
        .nt-hist-date{font-size:11px;color:rgba(43,38,32,.4);}
        .nt-tip-row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
        .nt-tip-row:last-child{border-bottom:none;}
        @media(max-width:768px){.nt-2col{grid-template-columns:1fr;}.nt-content{padding:14px 16px;}.nt-sched-inputs{flex-direction:column;}}
      `}</style>

      <div className="nt-content">
        <div className="nt-lbl">{t('nt_compose')}</div>
        <div className="nt-2col">
          {/* Composer */}
          <div className="nt-card">
            <div className="nt-card-title">{t('nt_compose')}</div>
            <div className="nt-card-sub">{t('nt_compose_sub')}</div>
            <textarea className="nt-textarea" placeholder={t('nt_placeholder')} value={message} onChange={e => handleMessage(e.target.value)} />
            <div className={`nt-char-count${charCount > MAX_CHARS * 0.8 ? ' nt-char-count--warn' : ''}`}>{charCount} / {MAX_CHARS}</div>

            <div className="nt-field-label">{t('nt_audience')}</div>
            <div className="nt-audience-grid" style={{ marginBottom: 16 }}>
              {AUDIENCES.map(({ key, label, desc, count, color, bg }) => (
                <div key={key} className={`nt-audience-opt${audience === key ? ' nt-audience-opt--on' : ''}`} onClick={() => setAudience(key)}>
                  <div className="nt-aud-radio">{audience === key && <div className="nt-aud-dot" />}</div>
                  <div className="nt-aud-info"><div className="nt-aud-name">{label}</div><div className="nt-aud-desc">{desc}</div></div>
                  <span className="nt-aud-count" style={{ color, background: bg }}>{count.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="nt-field-label">{t('nt_send_type')}</div>
            <div className="nt-send-type">
              <button className={`nt-type-btn${sendType === 'instant' ? ' nt-type-btn--on' : ''}`} onClick={() => setSendType('instant')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {t('nt_instant')}
              </button>
              <button className={`nt-type-btn${sendType === 'scheduled' ? ' nt-type-btn--on' : ''}`} onClick={() => setSendType('scheduled')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {t('nt_schedule')}
              </button>
            </div>

            {sendType === 'scheduled' && (
              <div className="nt-sched-inputs">
                <input type="date" className="nt-date-input" value={schedDate} onChange={e => setSchedDate(e.target.value)} />
                <input type="time" className="nt-date-input" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
              </div>
            )}

            {notifLimit < 999999 && (
              <div style={{ fontSize: 11, color: atNotifLimit ? '#B23B3B' : 'rgba(43,38,32,.4)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>{sent.length} / {notifLimit} notificaciones este mes</span>
                {atNotifLimit && <span style={{ fontWeight: 700 }}>Mejorá el plan para seguir enviando</span>}
              </div>
            )}
            {sentSuccess
              ? <div className="nt-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('nt_success').replace('{n}', selectedAudience.count.toLocaleString())}</div>
              : <button className="nt-send-btn" onClick={handleSend} disabled={!message.trim() || (sendType === 'scheduled' && (!schedDate || !schedTime)) || atNotifLimit}>
                  {atNotifLimit ? 'Límite alcanzado — mejorá el plan' : sendType === 'instant' ? t('nt_send_btn').replace('{n}', selectedAudience.count.toLocaleString()) : t('nt_schedule_btn')}
                </button>
            }
          </div>

          {/* Preview + tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="nt-card">
              <div className="nt-card-title">{t('nt_preview')}</div>
              <div className="nt-card-sub">{t('nt_preview_sub')}</div>
              <div className="nt-preview-card">
                <div className="nt-preview-header"><div className="nt-preview-logo" /><span className="nt-preview-app">Stampa · {t('now').toLowerCase()}</span></div>
                {message ? <div className="nt-preview-message">{message}</div> : <div className="nt-preview-placeholder">{t('nt_preview_empty')}</div>}
                <div className="nt-preview-reach">{t('nt_for')} {selectedAudience.label} · {selectedAudience.count.toLocaleString()} {t('nt_recipients')}</div>
              </div>
            </div>
            <div className="nt-card">
              <div className="nt-card-title">{t('nt_tips')}</div>
              {[t('nt_tip1'), t('nt_tip2'), t('nt_tip3')].map((tip, i) => (
                <div key={i} className="nt-tip-row">
                  <span style={{ fontSize: 14 }}>{['⏰','🎯','✍️'][i]}</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(43,38,32,.6)', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nt-lbl">{t('nt_scheduled')}</div>
        <div className="nt-card">
          {scheduled.length === 0
            ? <div className="nt-empty">{t('nt_no_scheduled')}</div>
            : scheduled.map((n: ScheduledNotif) => {
                const aud = AUDIENCES.find(a => a.key === n.audience)!
                return (
                  <div key={n.id} className="nt-sched-row">
                    <div className="nt-sched-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                    <div className="nt-sched-info">
                      <div className="nt-sched-msg">{n.message}</div>
                      <div className="nt-sched-meta">
                        <span className="nt-aud-badge" style={{ color: aud.color, background: aud.bg }}>{AUDIENCE_LABELS[n.audience]}</span>
                        <span className="nt-sched-time">{n.scheduledAt}</span>
                      </div>
                    </div>
                    <button className="nt-cancel-btn" onClick={() => cancelScheduled(n.id)}>{t('nt_cancel')}</button>
                  </div>
                )
              })
          }
        </div>

        <div className="nt-lbl">{t('nt_history')}</div>
        <div className="nt-card">
          {sent.map((n: SentNotif) => {
            const aud = AUDIENCES.find(a => a.key === n.audience)!
            return (
              <div key={n.id} className="nt-hist-row">
                <div className="nt-hist-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                <div className="nt-hist-info">
                  <div className="nt-hist-msg">{n.message}</div>
                  <div className="nt-hist-meta">
                    <span className="nt-aud-badge" style={{ color: aud.color, background: aud.bg }}>{AUDIENCE_LABELS[n.audience]}</span>
                    <span className="nt-hist-reach">{n.sentCount.toLocaleString()} {t('nt_sent')}</span>
                    <span className="nt-hist-date">{n.sentAt}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}