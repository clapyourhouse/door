# M1 セットアップ(Supabase と動作確認)

## 構成
- `supabase/migrations/20261114000000_init.sql`: テーブル(cities, usage, passes, handoffs, pass_interest)、残回数の関数、初期の8都市
- `supabase/migrations/20261114100000_growth.sql`: 計測(events)、アンケート(feedback)、担当者の状態(staff_status)、Stripeのパス付与(grant_pass)
- `supabase/functions/chat`: AI回答(無料5回、パス中は1日100回)。OpenAIキーはここだけ
- `supabase/functions/stripe-webhook`: Stripeの支払い完了を受けて7日パスを付与(署名を検証)
- `supabase/functions/handoff`: 「人に聞く」(無料2回まで、パス中は1日3回)
- `app/www/config.js`: 画面側の公開設定(URL・anonキー・Maps Embedキー)

## 手順(北村さんの作業)
1. Supabaseでプロジェクトを作る。Authentication → Sign In / Providers で **Anonymous sign-ins を有効**にする。
2. SQLを実行する。SQL Editorで `20261114000000_init.sql`、続けて `20261114100000_growth.sql` を、この順に実行する(または `npx supabase db push`)。
3. 新しいOpenAIキーを、Supabaseのシークレットに**直接**設定する(チャットやコードに貼らない)。
   ```
   supabase secrets set OPENAI_API_KEY=... OPENAI_MODEL=<使うモデル名>
   ```
   `OPENAI_MODEL` を省略すると `gpt-4.1-mini`。使えるモデルは、OpenAIの管理画面で確認する。
4. 関数をデプロイする。
   ```
   supabase functions deploy chat
   supabase functions deploy handoff
   supabase functions deploy stripe-webhook
   ```
5. `app/www/config.js` に、Project URL と anon(公開)キーを入れる。Maps Embedキーも入れる。
6. Maps Embedキーは、Google Cloud側で「Maps Embed API のみ」「HTTPリファラー制限」にする。許可するリファラーに、公開ページのURLと `https://localhost/*`(Androidアプリ内)を入れる。

## 人からの返信
Supabaseのテーブルエディタで `handoffs` を開き、`reply` に返信を書くと、自動で `status=answered` になり、旅行者の画面に20秒ごとの確認で表示される。通知は、`NOTIFY_WEBHOOK_URL` を設定するとWebhookへ飛ぶ(Slack、Makeなど)。

## 担当者のオンライン表示
Supabaseのテーブルエディタで `staff_status` を開き、1行だけの `online` を true(オンライン)/ false(オフライン)に切り替える。旅行者の画面に1分以内に反映される。オフライン時は「日本時間10〜18時に返信」と表示される。

## Stripeで7日パスを売る
1. Stripeで、7日パスの商品を作る(1回払い。JPY ¥980 と USD $6.99 の2通貨の価格を持たせられるか確認する)。その商品で **Payment Link** を作る。確認ページ(支払い後)のリダイレクト先を `公開URL/?paid=1` にする。
2. Stripe → Developers → Webhooks で、エンドポイントを追加する。URLは `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`、イベントは `checkout.session.completed` と `checkout.session.async_payment_succeeded`。
3. 表示される署名シークレット(`whsec_...`)を、Supabaseのシークレットに直接設定する。
   ```
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   任意で `STRIPE_PAYMENT_LINK_ID=plink_...` も設定すると、そのリンクの支払いだけがパスになる(他の商品を売る場合に安全)。
4. `app/www/config.js` の `stripePaymentLink` に、Payment Linkの公開URLを入れる。空のあいだは「興味あり」ボタンのまま。入れた時点で、購入ボタンに切り替わる。
5. まずはStripeのテストモードで、テストカード(4242 4242 4242 4242)で購入し、`passes` に行が入ることを確認する。その後、本番に切り替える。
6. 日本では特定商取引法に基づく表記のページが必要。プライバシーポリシーとあわせて公開前に用意する。

注意: 匿名ログインのため、パスはブラウザに紐づく。別の端末やブラウザのデータ削除では引き継げない。購入者には、Stripeの領収書メールをもとに、手動で付与し直す対応が必要になることがある。

## 計測(SQL Editorで見る)
```sql
-- 日別・イベント別の人数
select date_trunc('day', created_at at time zone 'Asia/Tokyo')::date as day, name, count(distinct user_id) as users
from events group by 1, 2 order by 1 desc, 2;

-- 流入元ごとの、最初の質問までの到達
select coalesce(ref, '(none)') as ref,
  count(distinct user_id) filter (where name = 'land_view') as visits,
  count(distinct user_id) filter (where name = 'first_question') as asked,
  count(distinct user_id) filter (where name in ('interest_click','buy_click')) as intent
from events group by 1 order by visits desc;
```
アンケートの結果は `feedback`、「興味あり」は `pass_interest`、購入は `passes`(`source = 'stripe'`)で見る。

## Gmailへの通知(アンケート・人への質問)
Google Apps Script(無料)で、新しいアンケートと「人に聞く」の質問を、Gmailに通知する。コードは `docs/notify-apps-script.gs`。
1. https://script.google.com で新しいプロジェクトを作り、`notify-apps-script.gs` の中身を貼る。`SECRET` を、自分で決めた長いランダムな文字列に変える。
2. **デプロイ → 新しいデプロイ → 種類：ウェブアプリ**。次のユーザーとして実行：**自分**、アクセスできるユーザー：**全員**。デプロイして、権限を承認する。表示されるURL(`.../exec`)をコピーする。
3. Supabaseのシークレット(Edge Functions → Secrets)に、`NOTIFY_WEBHOOK_URL` を追加する。値は `コピーしたURL?key=決めた文字列`。これで「人に聞く」の質問がGmailに届く。
4. Supabaseの **Integrations → Database Webhooks → Create a new hook** で、Table：`feedback`、Events：`Insert`、Type：HTTP Request、Method：`POST`、URL：手順3と同じ `URL?key=決めた文字列`。これでアンケートがGmailに届く。
5. 確認：画面でアンケートを送ると、数秒でメールが届く。

## 環境変数(任意)
`FREE_QUESTION_LIMIT`(5)、`PASS_DAILY_LIMIT`(100)、`HANDOFF_FREE_LIMIT`(2)、`HANDOFF_PASS_DAILY_LIMIT`(3)、`PASS_DAYS`(7)

## テスト済みの範囲
- SQLの残回数・引き継ぎ・返信トリガー: 13項目(PGliteで実行)
- Edge Functionsの認証・上限・AI失敗時の返却・履歴の切り詰め: 12項目(OpenAIとSupabaseをモックにして実行)
- 画面の通し動作(認証→質問→無料枠切れ→購入意思→人に聞く→返信表示→移動→言語切替→エラー): 24項目(jsdomとモックサーバー)
- Stripe署名検証・パス付与・重複受信・不正入力(関数): 13項目 / パス付与・延長・重複(SQL): 9項目 / 計測・アンケート・担当者表示・購入ボタン(画面): 追加分を含め43項目
- **未確認**: 実機・スマホ幅での見た目、実際のSupabase・OpenAI・Street View・Stripeとの接続
