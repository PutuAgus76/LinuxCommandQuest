"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProgress } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Terminal, 
  BookOpen, 
  Trophy, 
  Shield, 
  ArrowRight, 
  HelpCircle, 
  Code,
  CheckCircle,
  FolderOpen
} from "lucide-react";

export default function LandingPage() {
  const [hasProgress, setHasProgress] = useState(false);
  const [lastModuleId, setLastModuleId] = useState<string | null>(null);

  useEffect(() => {
    const progress = getProgress();
    if (progress.completedModuleIds.length > 0 || progress.totalPoints > 0) {
      setHasProgress(true);
    }
    if (progress.lastVisitedModuleId) {
      setLastModuleId(progress.lastVisitedModuleId);
    }
  }, []);

  const ctaLink = lastModuleId ? `/modul/${lastModuleId}` : "/dashboard";
  const ctaLabel = hasProgress ? "Lanjutkan Belajar" : "Mulai Belajar";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-16 md:py-24">
        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-1.5 bg-[#16A34A]/10 px-3 py-1.5 rounded-full text-[#16A34A] text-xs font-semibold uppercase tracking-wider font-sans">
              <Code className="h-3.5 w-3.5" />
              <span>Interactive Learning Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight font-sans">
              Belajar Command Linux <br />
              <span className="text-[#16A34A]">dari Nol</span> dengan Praktik!
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed font-sans">
              Linux Command Quest adalah website e-learning interaktif untuk memahami command line Linux dasar-menengah, manajemen file, dan sistem permission. Ketik langsung di terminal simulator untuk naik level.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href={ctaLink} passHref>
                <Button className="bg-[#16A34A] hover:bg-green-700 text-white font-sans text-base px-8 py-6 h-auto shadow-md gap-2 font-semibold">
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button variant="outline" className="border-gray-300 text-gray-700 font-sans text-base px-8 py-6 h-auto hover:bg-gray-50">
                  Lihat Kurikulum
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#181825] rounded-xl shadow-xl border border-gray-800 overflow-hidden font-mono text-xs">
              <div className="bg-[#11111b] px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                </div>
                <div className="text-gray-400 text-[10px] font-sans">user@linux: ~</div>
                <div className="w-8"></div>
              </div>
              <div className="p-5 space-y-3.5 text-gray-300">
                <div>
                  <span className="text-purple-400">user@linux:~$</span> <span className="text-green-400">mkdir latihan</span>
                </div>
                <div>
                  <span className="text-purple-400">user@linux:~$</span> <span className="text-green-400">cd latihan</span>
                </div>
                <div>
                  <span className="text-purple-400">user@linux:~/latihan$</span> <span className="text-green-400">touch catatan.txt</span>
                </div>
                <div>
                  <span className="text-purple-400">user@linux:~/latihan$</span> <span className="text-green-400">chmod 755 catatan.txt</span>
                </div>
                <div>
                  <span className="text-purple-400">user@linux:~/latihan$</span> <span className="text-green-400">ls -l</span>
                  <div className="text-gray-400 mt-1 pl-1 border-l-2 border-green-500/30">
                    -rwxr-xr-x 1 user user 0 Jun 30 18:50 catatan.txt
                  </div>
                </div>
                <div className="text-green-400 font-bold select-none pt-2 text-center animate-pulse">
                  ✓ Level 1 & Level 5 Selesai!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 md:py-24 bg-[#FAFAFA]">
        <div className="container mx-auto px-4 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-sans">
              Metode Belajar yang Efektif
            </h2>
            <p className="text-gray-600 font-sans">
              Kami menyatukan teori dasar dengan praktik simulasi langsung untuk mempercepat pemahaman Anda tentang Command Line Linux.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 bg-[#16A34A]/10 text-[#16A34A] rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-gray-800 font-sans">Materi Singkat & Padat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">
                  Pelajari arti, fungsi, format sintaks, dan contoh command line nyata tanpa bertele-tele.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 bg-[#F97316]/10 text-[#F97316] rounded-lg flex items-center justify-center mb-2">
                  <Terminal className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-gray-800 font-sans">Terminal Simulator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">
                  Ketik jawaban Anda langsung pada terminal simulator web. Belajar aman tanpa perlu install OS Linux.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 bg-[#16A34A]/10 text-[#16A34A] rounded-lg flex items-center justify-center mb-2">
                  <Trophy className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-gray-800 font-sans">Gamifikasi & Poin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">
                  Kumpulkan poin dari setiap jawaban benar dan unlock badge pencapaian seiring kemajuan Anda.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 bg-[#F97316]/10 text-[#F97316] rounded-lg flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-gray-800 font-sans">Lock Level Bertahap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">
                  Materi dikunci secara terstruktur. Selesaikan latihan Level 1 untuk membuka Level 2 dan seterusnya.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center items-center gap-2 text-xs text-gray-400 font-sans">
            <HelpCircle className="h-4 w-4" />
            <span>Kewalahan menjawab? Tombol "Lihat Jawaban" akan muncul otomatis setelah Anda salah 3 kali berturut-turut.</span>
          </div>
        </div>
      </section>

      {/* Course Stats Preview */}
      <section className="bg-white py-16 border-t border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col md:flex-row justify-around items-center gap-8 text-center">
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-[#16A34A] font-sans">10</div>
              <div className="text-sm font-medium text-gray-500 font-sans flex items-center justify-center gap-1">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                <span>Level Pembelajaran</span>
              </div>
            </div>
            <div className="h-px w-16 md:h-12 md:w-px bg-gray-200"></div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-[#F97316] font-sans">26</div>
              <div className="text-sm font-medium text-gray-500 font-sans flex items-center justify-center gap-1">
                <Terminal className="h-4 w-4 text-gray-400" />
                <span>Latihan Command Line</span>
              </div>
            </div>
            <div className="h-px w-16 md:h-12 md:w-px bg-gray-200"></div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-[#16A34A] font-sans">5</div>
              <div className="text-sm font-medium text-gray-500 font-sans flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <span>Badge Achievement</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
