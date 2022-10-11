import { Dialog } from "@headlessui/react";
import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Document, Page } from "react-pdf";
import PageDialog from "../components/PageDialog";
import _ from "lodash";
import useAxios from "axios-hooks";
import { PDFDocument } from "pdf-lib";
import YOLOConfirmPage from "../components/YOLOConfirmPage";
import { Oval } from "react-loader-spinner";

interface UploadFileToYOLOData {
  crop_url: string;
  orig_url: string;
  pred_url: string;
  base: string;
  predict: {
    [page: string]: {
      [label: string]: {
        class: number;
        confidence: number;
        name: string;
        xmax: number;
        xmin: number;
        ymax: number;
        ymin: number;
      };
    };
  };
}

function Home() {
  const [currentDialog, setCurrentDialog] = useState("upload");
  const [files, setFiles] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [base, setBase] = useState<string | null>();

  const [
    { data: uploadFileToYOLOData, loading: uploadFileToYOLOLoading },
    uploadFileToYOLO,
  ] = useAxios<UploadFileToYOLOData>(
    {
      method: "POST",
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    { manual: true }
  );

  const [{ data: OCRData, loading: OCRLoading }, OCR] = useAxios(
    {
      method: "POST",
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    { manual: true }
  );

  const [{ data: classifyData, loading: classifyLoading }, classify] = useAxios(
    {
      method: "POST",
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    { manual: true }
  );

  const [{ data: finalUploadData, loading: finalUploadLoading }, finalUpload] =
    useAxios(
      {
        method: "POST",
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      },
      { manual: true }
    );

  const fileUploadInput = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (
        fileUploadInput.current?.files != null &&
        fileUploadInput.current.files.length > 0
      ) {
        setFiles(fileUploadInput.current.files);
        setCurrentDialog("select");
      }
    },
    [fileUploadInput]
  );

  const formSubmitHandler = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const pages = _.get(event.target, "pages");

      const fr = new FileReader();
      fr.onload = async (e) => {
        if (e.target?.result && typeof e.target.result !== "string") {
          const pdfDoc = await PDFDocument.load(
            new Uint8Array(e.target.result)
          );
          let removed = 0;
          if (pages.entries != null)
            for (const [index, page] of pages.entries()) {
              if (!page.checked) {
                pdfDoc.removePage(index - removed);
                removed++;
              }
            }
          pdfDoc.save().then(async (fileBytes) => {
            const file = new File([fileBytes], files[0].name);
            const reqFormData = new FormData();
            reqFormData.append("file", file);
            const res = await uploadFileToYOLO({
              url: `/predict?page_count=${pdfDoc.getPageCount()}`,
              data: reqFormData,
            });
            setBase(res.data.base);
            if (res != null) setCurrentDialog("confirm_yolo");
          });
        }
      };
      fr.readAsArrayBuffer(files[0]);
    },
    [files, uploadFileToYOLO]
  );

  const OCRReqHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (uploadFileToYOLOData != null) {
        let pages: any = {};
        for (let [page, problems] of Object.entries(
          uploadFileToYOLOData.predict
        )) {
          const filtered = _.filter(
            problems,
            ({ name }) => name === "question"
          );
          pages[page] = Object.keys(filtered);
        }
        setCurrentDialog("ocr_processing");
        OCR({
          url: "ocr",
          data: {
            base: base,
            pages: pages,
          },
        });
      }
    },
    [uploadFileToYOLOData, base, OCR]
  );

  const ClassifyReqHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (OCRData != null) {
        setCurrentDialog("classifier_processing");
        classify({
          url: `classify?base=${base}`,
        });
      }
    },
    [OCRData, classify, base]
  );

  const ToConfirmClassifyHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setCurrentDialog("confirm_classes");
    },
    [currentDialog]
  );

  return (
    <>
      <PageDialog isOpen={currentDialog === "upload"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            上載文件
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">讓 AI 分辨題目</p>
          </div>
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <input
              type="file"
              accept=".pdf"
              ref={fileUploadInput}
              name="file"
            />
            <button
              type="button"
              className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={upload}
            >
              選擇頁數
            </button>
          </div>
        </Dialog.Panel>
      </PageDialog>
      <PageDialog isOpen={currentDialog === "select"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            選擇頁面
          </Dialog.Title>
          <div className="my-2">
            <p className="text-sm text-gray-500">選擇需要處理的頁面</p>
          </div>
          <form onSubmit={formSubmitHandler}>
            {files && (
              <Document
                file={files[0]}
                onLoadError={(error) => console.log(error)}
                onLoadSuccess={(pdf) => setPdf(pdf)}
              >
                <div className="flex gap-2 flex-wrap">
                  {pdf?.numPages != null &&
                    _.range(0, pdf.numPages).map((index) => {
                      return (
                        <label className="w-40 relative" key={index}>
                          <Page
                            className="rounded-xl overflow-hidden border w-full shadow"
                            width={160}
                            pageIndex={index}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                          <input
                            type="checkbox"
                            className="absolute right-0 bottom-0 rounded-full p-3"
                            name="pages"
                            defaultChecked
                            {...{
                              disabled: pdf.numPages === 1,
                            }}
                          />
                        </label>
                      );
                    })}
                </div>
              </Document>
            )}
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <button
                type="submit"
                className={`ml-auto inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2${
                  uploadFileToYOLOLoading ? " opacity-50" : ""
                }`}
                {...{
                  disabled: uploadFileToYOLOLoading,
                }}
              >
                {uploadFileToYOLOLoading ? "處理中..." : "確定並上載"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </PageDialog>
      <PageDialog isOpen={currentDialog === "confirm_yolo"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {uploadFileToYOLOData != null && (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                確定裁切
              </Dialog.Title>
              <div className="my-2">
                <p className="text-sm text-gray-500">由 AI 自動裁剪後之題目</p>
              </div>
              <YOLOConfirmPage data={uploadFileToYOLOData} />
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <button
                  type="submit"
                  className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  onClick={OCRReqHandler}
                >
                  確定裁切
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </PageDialog>
      <PageDialog
        isOpen={currentDialog === "ocr_processing"}
        onClose={() => {}}
      >
        <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {currentDialog === "ocr_processing" && (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                檢測文字
              </Dialog.Title>
              <div className="my-2">
                <p className="text-sm text-gray-500">
                  使用 OCR 技術識別圖中文字
                </p>
              </div>
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <button
                  type="submit"
                  className={`ml-auto inline-flex justify-center items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2${
                    OCRLoading ? " opacity-50" : ""
                  }`}
                  onClick={ClassifyReqHandler}
                  {...{
                    disabled: OCRLoading,
                  }}
                >
                  {OCRLoading ? (
                    <>
                      <Oval
                        height={16}
                        width={16}
                        strokeWidth={8}
                        color={"#ffffff"}
                        secondaryColor={"#aaaaaa"}
                      />
                      處理中...
                    </>
                  ) : (
                    "下一步"
                  )}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </PageDialog>
      <PageDialog
        isOpen={currentDialog === "classifier_processing"}
        onClose={() => {}}
      >
        <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {currentDialog === "classifier_processing" && (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                題目分類
              </Dialog.Title>
              <div className="my-2">
                <p className="text-sm text-gray-500">使用 AI 分類題目</p>
              </div>
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <button
                  type="submit"
                  className={`ml-auto inline-flex justify-center items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2${
                    classifyLoading ? " opacity-50" : ""
                  }`}
                  onClick={ToConfirmClassifyHandler}
                  {...{
                    disabled: classifyLoading,
                  }}
                >
                  {classifyLoading ? (
                    <>
                      <Oval
                        height={16}
                        width={16}
                        strokeWidth={8}
                        color={"#ffffff"}
                        secondaryColor={"#aaaaaa"}
                      />
                      處理中...
                    </>
                  ) : (
                    "下一步"
                  )}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </PageDialog>
      <PageDialog
        isOpen={currentDialog === "confirm_classes"}
        onClose={() => {}}
      >
        <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {currentDialog === "confirm_classes" && (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                確認分類
              </Dialog.Title>
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <button
                  type="submit"
                  className={`ml-auto inline-flex justify-center items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2${
                    finalUploadLoading ? " opacity-50" : ""
                  }`}
                  onClick={ToConfirmClassifyHandler}
                  {...{
                    disabled: classifyLoading,
                  }}
                >
                  {finalUploadLoading ? (
                    <>
                      <Oval
                        height={16}
                        width={16}
                        strokeWidth={8}
                        color={"#ffffff"}
                        secondaryColor={"#aaaaaa"}
                      />
                      提交中...
                    </>
                  ) : (
                    "完成"
                  )}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </PageDialog>
    </>
  );
}

export default Home;
