import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Reply, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SimplePagination } from "@/components/simple-pagination"
import { api, ApiError } from "@/lib/api"
import type { Contact, ContactStatus, PaginatedResult } from "@/lib/types"

const REPLY_MAX_LENGTH = 5000

const statusLabels: Record<ContactStatus, string> = {
  pending: "Pendiente",
  read: "Leída",
  answered: "Respondida",
}

const statusVariant: Record<ContactStatus, "default" | "secondary" | "outline"> = {
  pending: "default",
  read: "secondary",
  answered: "outline",
}

export default function ConsultasPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PaginatedResult<Contact> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [replyingTo, setReplyingTo] = useState<Contact | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const load = () => {
    setIsLoading(true)
    api
      .get<PaginatedResult<Contact>>(`/api/admin/contacts?page=${page}&pageSize=20`)
      .then(setResult)
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [page])

  const updateStatus = async (contact: Contact, status: ContactStatus) => {
    try {
      await api.patch(`/api/admin/contacts/${contact._id}/status`, { status })
      toast.success("Estado actualizado")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos actualizar el estado")
    }
  }

  const openReply = (contact: Contact) => {
    setReplyingTo(contact)
    setReplyMessage("")
  }

  const closeReply = (open: boolean) => {
    if (!open && !isSending) setReplyingTo(null)
  }

  const sendReply = async () => {
    if (!replyingTo) return
    const message = replyMessage.trim()
    if (!message) {
      toast.error("Escribí una respuesta antes de enviarla")
      return
    }
    setIsSending(true)
    try {
      await api.post(`/api/admin/contacts/${replyingTo._id}/reply`, { message })
      toast.success("Respuesta enviada")
      setReplyingTo(null)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos enviar la respuesta")
    } finally {
      setIsSending(false)
    }
  }

  const remove = async (contact: Contact) => {
    if (!confirm("¿Eliminar esta consulta?")) return
    try {
      await api.delete(`/api/admin/contacts/${contact._id}`)
      toast.success("Consulta eliminada")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos eliminar la consulta")
    }
  }

  const totalPages = result?.totalPages ?? 1

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Consultas</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="text-muted-foreground">No hay consultas recibidas.</p>
      ) : (
        <>
          <div className="space-y-4">
            {result.data.map((contact) => {
              const isAnswered = contact.status === "answered"
              return (
                <div key={contact._id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">{contact.name}</h3>
                        <Badge variant={statusVariant[contact.status]} className="rounded-full">
                          {statusLabels[contact.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.email}
                        {contact.phone ? ` · ${contact.phone}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(contact.createdAt).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{contact.subject}</p>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{contact.message}</p>

                  {contact.reply && (
                    <div className="rounded-2xl bg-muted/60 p-4 mb-4">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Tu respuesta
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(contact.reply.answeredAt).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line">{contact.reply.message}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {!isAnswered && (
                      <>
                        <Select
                          value={contact.status}
                          onValueChange={(v) => updateStatus(contact, v as ContactStatus)}
                        >
                          <SelectTrigger className="w-40 rounded-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="read">Leída</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="rounded-full h-9" onClick={() => openReply(contact)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Responder
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(contact)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        </>
      )}

      <Dialog open={replyingTo !== null} onOpenChange={closeReply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder consulta</DialogTitle>
            {replyingTo && (
              <DialogDescription>
                Para {replyingTo.name} ({replyingTo.email}) · {replyingTo.subject}
              </DialogDescription>
            )}
          </DialogHeader>
          {replyingTo && (
            <div className="rounded-2xl bg-muted/60 p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{replyingTo.message}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reply-message">Respuesta</Label>
            <Textarea
              id="reply-message"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              maxLength={REPLY_MAX_LENGTH}
              rows={6}
              placeholder="Escribí tu respuesta..."
              className="rounded-xl"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {replyMessage.length}/{REPLY_MAX_LENGTH}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => closeReply(false)}
              disabled={isSending}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={sendReply}
              disabled={isSending || replyMessage.trim().length === 0}
              className="rounded-full"
            >
              {isSending ? "Enviando..." : "Enviar respuesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
