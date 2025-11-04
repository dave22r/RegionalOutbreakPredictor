import "./Loading.css";

export const LinearLoader = ({ progress, indeterminate }) => {
  return (
    <div className="linear-loader">
      {!indeterminate && typeof progress === "number" ? (
        <div className="inner" />
      ) : (
        <>
          <div className="idtm-1">
            <div className="inner"></div>
          </div>
          <div className="idtm-2">
            <div className="inner"></div>
          </div>
        </>
      )}
    </div>
  );
};
