import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
export const runtime = 'nodejs';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const trialId = formData.get('trial_id') as string | null;
    const fileType = formData.get('file_type') as string | null; // 'complaint' | 'judgment'

    if (!file || !trialId || !fileType) {
      return NextResponse.json({ error: 'file, trial_id, file_type は必須です' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDFファイルのみ受け付けています' }, { status: 400 });
    }

    const bucket = process.env.S3_BUCKET_NAME ?? 'accountabilities-documents';
    const key = `trials/${trialId}/${fileType}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    }));

    const url = `https://${bucket}.s3.ap-northeast-1.amazonaws.com/${key}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
