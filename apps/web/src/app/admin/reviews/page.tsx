"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, Review } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  ShieldAlert,
  EyeOff,
  Eye,
  Store,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hide Modal
  const [hidingReview, setHidingReview] = useState<Review | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.getReviews();
      setReviews(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleHideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hidingReview || !hideReason.trim()) return;

    setIsSubmitting(true);
    setReviews((prev) =>
      prev.map((r) =>
        r.id === hidingReview.id
          ? { ...r, isHidden: true, hiddenReason: hideReason.trim() }
          : r
      )
    );
    toast.success("Đã ẩn đánh giá vi phạm khỏi giao diện người dùng.");
    setHidingReview(null);
    setHideReason("");
    setIsSubmitting(false);
  };

  const handleUnhide = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, isHidden: false, hiddenReason: undefined } : r
      )
    );
    toast.success("Đã mở hiển thị lại đánh giá này.");
  };

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản Trị Đánh Giá & Bình Luận
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phát hiện và ẩn các đánh giá spam, xúc phạm hoặc vi phạm tiêu chuẩn cộng đồng sàn.
            </p>
          </div>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs rounded-xl">
              ← Về Dashboard
            </Button>
          </Link>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Đang tải danh sách đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <Card className="text-center py-16 rounded-2xl border shadow-xs bg-white p-8">
            <Star className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Chưa có đánh giá nào trên sàn</h3>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card
                key={r.id}
                className={`rounded-2xl border shadow-xs bg-white overflow-hidden transition-all ${
                  r.isHidden ? "border-red-200 bg-red-50/20" : "border-slate-200"
                }`}
              >
                <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-xs text-slate-800">
                      {r.customer?.fullName || "Khách hàng"}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      Cửa hàng: <strong>{r.store?.storeName || "Nhà xe"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= r.rateStar ? "text-amber-500 fill-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    {r.isHidden ? (
                      <Badge className="bg-red-600 text-white text-[10px] gap-1">
                        <EyeOff className="h-3 w-3" /> Đã ẩn
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                        <Eye className="h-3 w-3" /> Hiển thị
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    &quot;{r.comment}&quot;
                  </p>

                  {r.isHidden && r.hiddenReason && (
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong>Lý do bị ẩn: </strong> {r.hiddenReason}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Thời gian: {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "Gần đây"}
                    </span>

                    <div>
                      {r.isHidden ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnhide(r.id)}
                          className="text-xs h-8 rounded-lg gap-1.5 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        >
                          <Eye className="h-3.5 w-3.5" /> Bỏ ẩn đánh giá
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setHidingReview(r);
                            setHideReason("");
                          }}
                          className="text-xs h-8 rounded-lg gap-1.5 text-red-600 hover:bg-red-50 border-red-200 hover:text-red-700"
                        >
                          <EyeOff className="h-3.5 w-3.5" /> Ẩn đánh giá vi phạm
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hide Modal */}
      {hidingReview && (
        <Dialog open={!!hidingReview} onOpenChange={() => setHidingReview(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-red-700">
                Ẩn Đánh Giá Vi Phạm
              </DialogTitle>
              <DialogDescription className="text-xs">
                Đánh giá của khách: <strong>{hidingReview.customer?.fullName}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleHideSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Lý do ẩn đánh giá này *</Label>
                <Textarea
                  placeholder="VD: Chứa từ ngữ thô tục, link spam cờ bạc, nội dung không liên quan đến chất lượng xe..."
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  className="text-xs min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHidingReview(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận ẩn"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

